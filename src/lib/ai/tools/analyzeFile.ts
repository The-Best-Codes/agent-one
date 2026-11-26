import { readDir, readFile, stat } from "@tauri-apps/plugin-fs";
import { generateText, type LanguageModel, tool } from "ai";
import { z } from "zod";

import { getAgentOneRequestHeaders } from "@/lib/ai/providers/agent-one-headers";
import { type FileKind, getFileKind, getMediaType, isTextContent } from "@/lib/attachments";
import { getFileName } from "@/lib/file-icons";
import formatBytes from "@/lib/format-bytes";

const VIEW_TIMEOUT_MS = 120_000;
const MAX_FILE_BYTES = 500 * 1024 * 1024;
const MISSING_FILE_RETRIES = 3;
const MISSING_FILE_RETRY_MS = 1000;

const tryStat = (path: string) =>
  stat(path).then(
    (info) => info.size,
    () => undefined,
  );

const normalizeFileName = (name: string) => name.replace(/\s+/g, " ").normalize("NFC");

function getPathCandidates(path: string): string[] {
  if (!path.includes("%")) return [path];
  try {
    const decoded = decodeURIComponent(path);
    return decoded === path ? [path] : [path, decoded];
  } catch {
    return [path];
  }
}

async function findSimilarPath(path: string): Promise<string | undefined> {
  const name = getFileName(path);
  const dir = path.slice(0, path.length - name.length);
  if (!name || !dir) return undefined;
  const target = normalizeFileName(name);
  const entries = await readDir(dir).catch(() => []);
  const match = entries.find((entry) => normalizeFileName(entry.name) === target);
  return match ? dir + match.name : undefined;
}

async function resolveFile(
  path: string,
  abortSignal?: AbortSignal,
): Promise<{ path: string; size: number }> {
  const candidates = getPathCandidates(path);
  for (let attempt = 0; attempt <= MISSING_FILE_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, MISSING_FILE_RETRY_MS));
      abortSignal?.throwIfAborted();
    }
    for (const candidate of candidates) {
      const size = await tryStat(candidate);
      if (size !== undefined) return { path: candidate, size };
    }
    for (const candidate of candidates) {
      const similar = await findSimilarPath(candidate);
      if (!similar) continue;
      const size = await tryStat(similar);
      if (size !== undefined) return { path: similar, size };
    }
  }
  const { size } = await stat(path);
  return { path, size };
}

export interface AnalyzeFileContext {
  models: Record<FileKind, LanguageModel>;
  chatId?: string;
  parentTurnId?: string;
}

export const createAnalyzeFileTool = (context: AnalyzeFileContext) =>
  tool({
    description:
      "Analyze any file, like an image, video, audio, or PDF, by sending it to another AI model and asking about it. Use this when you need to know what's in a file that you can't read yourself, whether the user attached it or not. The other model costs the user money each time, so don't use this for files you can read with your other tools. Describe exactly what you need in the prompt, because the other model only sees the file and your prompt. Only call this after whatever creates or changes the file has finished, never in the same step as it, because tool calls in one step run at the same time and the file may not exist yet.",
    inputSchema: z.object({
      path: z
        .string()
        .describe(
          "The file's absolute path on disk, like `/Users/me/report final.pdf`. Use a plain, decoded path, not a link like `attachment://...` or `mention://...`.",
        ),
      prompt: z
        .string()
        .describe(
          "What you need from the file, like `Describe this screenshot and list any error messages in it.`",
        ),
    }),
    execute: async ({ path: rawPath, prompt }, { abortSignal }) => {
      let name = getFileName(rawPath.trim());
      let model: LanguageModel | undefined;
      try {
        const { path, size } = await resolveFile(rawPath.trim(), abortSignal);
        name = getFileName(path);
        if (size > MAX_FILE_BYTES) {
          throw new Error(
            `The file is ${formatBytes(size)}, which is over the ${formatBytes(MAX_FILE_BYTES)} limit.`,
          );
        }
        const data = await readFile(path);
        abortSignal?.throwIfAborted();
        const mediaType =
          getMediaType(name) ?? (isTextContent(data) ? "text/plain" : "application/octet-stream");
        model = context.models[getFileKind(mediaType)];
        const result = await generateText({
          model,
          instructions:
            "You look at a file for another AI model that can't see it. Answer its request accurately and completely, using only what's in the file. Quote any text that matters exactly. If you can't read the file or something isn't in it, say so plainly.",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "file", data, mediaType, filename: name },
              ],
            },
          ],
          abortSignal,
          timeout: VIEW_TIMEOUT_MS,
          maxRetries: 1,
          headers: getAgentOneRequestHeaders(model, {
            type: "analyze-file",
            chatId: context.chatId,
            parentTurnId: context.parentTurnId,
          }),
        });
        return {
          name,
          model: typeof model === "string" ? model : model.modelId,
          description: result.text,
        };
      } catch (error) {
        if (abortSignal?.aborted) throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Couldn't analyze ${name}: ${message}\n\nTry to understand the file another way instead, like reading it or inspecting it with commands. Don't change the original file; work on a copy if you need to convert or process it.`,
          { cause: error },
        );
      }
    },
  });
