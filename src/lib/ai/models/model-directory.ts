import { BaseDirectory, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { atom, getDefaultStore } from "jotai";
import { z } from "zod";

import { lastModelDirectorySyncTimestampAtom } from "@/lib/jotai/atoms";

const MODEL_DIRECTORY_SOURCE_URL =
  "https://raw.githubusercontent.com/The-Best-Codes/ai-model-directory/main/data/all.min.json";
const MODEL_DIRECTORY_FILENAME = "model-directory.json";
export const MODEL_DIRECTORY_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const MODEL_DIRECTORY_SYNC_CHECK_INTERVAL_MS = 60 * 60 * 1000;

// eslint-disable-next-line no-control-regex
const controlCharacterPattern = /[\u0000-\u001f\u007f]/;
const safeString = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => !controlCharacterPattern.test(value));
const nonnegativeNumber = z.number().nonnegative();
const nonnegativeInteger = z.number().int().nonnegative();
const modality = z.enum(["text", "image", "audio", "video", "file"]);

const modelSchema = z.looseObject({
  id: safeString(200),
  name: safeString(500).optional(),
  features: z
    .looseObject({
      attachment: z.boolean().optional(),
      reasoning: z.boolean().optional(),
      tool_call: z.boolean().optional(),
      structured_output: z.boolean().optional(),
      temperature: z.boolean().optional(),
    })
    .optional(),
  pricing: z
    .looseObject({
      input: nonnegativeNumber.optional(),
      output: nonnegativeNumber.optional(),
      reasoning: nonnegativeNumber.optional(),
      cache_read: nonnegativeNumber.optional(),
      cache_write: nonnegativeNumber.optional(),
      input_audio: nonnegativeNumber.optional(),
      output_audio: nonnegativeNumber.optional(),
    })
    .optional(),
  limit: z
    .looseObject({
      context: nonnegativeInteger.optional(),
      input: nonnegativeInteger.optional(),
      output: nonnegativeInteger.optional(),
    })
    .optional(),
  modalities: z
    .looseObject({
      input: z.array(modality).optional(),
      output: z.array(modality).optional(),
    })
    .optional(),
});

const modelDirectorySchema = z.record(
  z.string(),
  z.looseObject({
    id: z.string().min(1),
    name: z.string().min(1),
    models: z.record(z.string(), modelSchema),
  }),
);

export type ModelRecord = z.infer<typeof modelSchema>;
export type ModelDirectoryData = z.infer<typeof modelDirectorySchema>;

const DEFAULT_MODEL_DIRECTORY: ModelDirectoryData = {
  "agent-one": {
    id: "agent-one",
    name: "AgentOne",
    models: {
      auto: {
        id: "agent-one-auto",
        name: "Default",
        features: { tool_call: true, attachment: true, reasoning: true },
        modalities: { input: ["text", "image", "file"], output: ["text"] },
        limit: { context: 256000, output: 32000 },
      },
    },
  },
};

export const downloadedModelDirectoryAtom = atom<ModelDirectoryData | null>(null);
export const modelDirectoryStartupCompleteAtom = atom(false);
export const modelDirectoryDataAtom = atom((get) => ({
  ...get(downloadedModelDirectoryAtom),
  ...DEFAULT_MODEL_DIRECTORY,
}));
export const modelDirectoryStatusAtom = atom((get) => ({
  hasDownloadedList: get(downloadedModelDirectoryAtom) !== null,
  isStartupComplete: get(modelDirectoryStartupCompleteAtom),
  fetchedAt: get(lastModelDirectorySyncTimestampAtom),
}));

export interface ModelDirectoryUpdateResult {
  ok: boolean;
  error?: string;
  providerCount?: number;
  modelCount?: number;
  fetchedAt?: number;
}

function countModels(data: ModelDirectoryData): number {
  return Object.values(data).reduce(
    (total, provider) => total + Object.keys(provider.models).length,
    0,
  );
}

function parseModelDirectory(raw: string): ModelDirectoryData {
  const data = modelDirectorySchema.parse(JSON.parse(raw));
  if (countModels(data) === 0) throw new Error("Model list is empty");
  return data;
}

export async function loadPersistedModelDirectory(): Promise<void> {
  try {
    const raw = await readTextFile(MODEL_DIRECTORY_FILENAME, {
      baseDir: BaseDirectory.AppLocalData,
    });
    getDefaultStore().set(downloadedModelDirectoryAtom, parseModelDirectory(raw));
  } catch {
    getDefaultStore().set(downloadedModelDirectoryAtom, null);
  }
}

let updatePromise: Promise<ModelDirectoryUpdateResult> | null = null;

export function updateModelDirectory(): Promise<ModelDirectoryUpdateResult> {
  updatePromise ??= refreshModelDirectory().finally(() => {
    updatePromise = null;
  });
  return updatePromise;
}

async function refreshModelDirectory(): Promise<ModelDirectoryUpdateResult> {
  let raw: string;
  let data: ModelDirectoryData;

  try {
    const response = await tauriFetch(MODEL_DIRECTORY_SOURCE_URL, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return { ok: false, error: `Request failed with status ${response.status}` };
    }
    raw = await response.text();
    data = parseModelDirectory(raw);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update model list",
    };
  }

  try {
    await writeTextFile(MODEL_DIRECTORY_FILENAME, raw, { baseDir: BaseDirectory.AppLocalData });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save model list",
    };
  }

  const fetchedAt = Date.now();
  const store = getDefaultStore();
  store.set(downloadedModelDirectoryAtom, data);
  store.set(lastModelDirectorySyncTimestampAtom, fetchedAt);

  return {
    ok: true,
    providerCount: Object.keys(data).length + 1,
    modelCount: countModels(data) + 1,
    fetchedAt,
  };
}
