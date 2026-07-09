import { BaseDirectory, exists, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { atom, getDefaultStore } from "jotai";

import {
  MODEL_DIRECTORY_SOURCE_URL,
  modelDirectoryData as bundledModelDirectoryData,
  modelDirectorySchema,
  normalizeModelDirectory,
  type ModelDirectoryData,
} from "@/assets/model-lists";

export type { ModelDirectoryData, ModelRecord } from "@/assets/model-lists";

const MODEL_DIRECTORY_FILENAME = "model-directory-override.json";
const BUNDLED_FETCHED_AT = 0;
export const MODEL_DIRECTORY_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const modelDirectoryOverrideAtom = atom<ModelDirectoryData | null>(null);
export const modelDirectoryFetchedAtAtom = atom(BUNDLED_FETCHED_AT);

export const modelDirectoryDataAtom = atom(
  (get) => get(modelDirectoryOverrideAtom) ?? bundledModelDirectoryData,
);

export const modelDirectoryStatusAtom = atom((get) => {
  const data = get(modelDirectoryDataAtom);
  return {
    usingDownloadedList: get(modelDirectoryOverrideAtom) !== null,
    fetchedAt: get(modelDirectoryFetchedAtAtom),
    providerCount: Object.keys(data).length,
    modelCount: countModels(data),
  };
});

export function getModelDirectoryData(): ModelDirectoryData {
  return getDefaultStore().get(modelDirectoryDataAtom);
}

export const modelDirectoryData: ModelDirectoryData = new Proxy({} as ModelDirectoryData, {
  get: (_target, prop) => {
    const data = getModelDirectoryData();
    const value = (data as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(data) : value;
  },
  has: (_target, prop) => prop in getModelDirectoryData(),
  ownKeys: () => Reflect.ownKeys(getModelDirectoryData()),
  getOwnPropertyDescriptor: (_target, prop) => {
    const data = getModelDirectoryData();
    return Reflect.getOwnPropertyDescriptor(data, prop);
  },
});

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

function normalizeRemoteData(raw: unknown): ModelDirectoryData {
  const parsed = modelDirectorySchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid model directory format: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function persistOverride(data: ModelDirectoryData): Promise<void> {
  await writeTextFile(MODEL_DIRECTORY_FILENAME, JSON.stringify(data), {
    baseDir: BaseDirectory.AppLocalData,
  });
}

export async function loadPersistedModelDirectory(): Promise<void> {
  const store = getDefaultStore();
  try {
    if (!(await exists(MODEL_DIRECTORY_FILENAME, { baseDir: BaseDirectory.AppLocalData }))) {
      return;
    }

    const raw = await readTextFile(MODEL_DIRECTORY_FILENAME, {
      baseDir: BaseDirectory.AppLocalData,
    });
    const parsed = modelDirectorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return;
    }

    store.set(modelDirectoryOverrideAtom, parsed.data);
  } catch {
    store.set(modelDirectoryOverrideAtom, null);
  }
}

export async function updateModelDirectory(): Promise<ModelDirectoryUpdateResult> {
  const store = getDefaultStore();
  let normalized: ModelDirectoryData;

  try {
    const response = await fetch(MODEL_DIRECTORY_SOURCE_URL, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      return { ok: false, error: `Request failed with status ${response.status}` };
    }

    normalized = normalizeRemoteData(normalizeModelDirectory(await response.json()));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update model list",
    };
  }

  const filtered = normalized;
  const fetchedAt = Date.now();

  try {
    await persistOverride(filtered);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save model list",
    };
  }

  store.set(modelDirectoryOverrideAtom, filtered);
  store.set(modelDirectoryFetchedAtAtom, fetchedAt);

  return {
    ok: true,
    providerCount: Object.keys(filtered).length,
    modelCount: countModels(filtered),
    fetchedAt,
  };
}

export async function resetModelDirectory(): Promise<void> {
  const store = getDefaultStore();
  store.set(modelDirectoryOverrideAtom, null);
  store.set(modelDirectoryFetchedAtAtom, BUNDLED_FETCHED_AT);

  try {
    if (await exists(MODEL_DIRECTORY_FILENAME, { baseDir: BaseDirectory.AppLocalData })) {
      await remove(MODEL_DIRECTORY_FILENAME, { baseDir: BaseDirectory.AppLocalData });
    }
  } catch {
    // Ignore removal failures; the in-memory override is already cleared.
  }
}
