import { readFile } from "@tauri-apps/plugin-fs";
import { generateText, type LanguageModel, tool } from "ai";
import { z } from "zod";

import { getAgentOneRequestHeaders } from "@/lib/ai/providers/agent-one-headers";
import { type FileKind, getFileKind, getMediaType, isTextContent } from "@/lib/attachments";
import { parseChatMentionHref } from "@/lib/chat-mentions";
import { getFileName } from "@/lib/file-icons";

const VIEW_TIMEOUT_MS = 120_000;

export interface AnalyzeFileContext {
  models: Record<FileKind, LanguageModel>;
  chatId?: string;
  parentTurnId?: string;
}

function resolvePath(reference: string): string {
  const trimmed = reference.trim();
  const mention = parseChatMentionHref(trimmed);
  return mention?.kind === "attachment" ? mention.path : trimmed;
}

export const createAnalyzeFileTool = (context: AnalyzeFileContext) =>
  tool({
    description:
      "Analyze any file, like an image, video, audio, or PDF, by asking another model about it. Use this when you need to know what's in a file that you can't read yourself, whether the user attached it or not. Describe exactly what you need in the prompt, because the other model only sees the file and your prompt.",
    inputSchema: z.object({
      path: z.string().describe("The path of the file."),
      prompt: z
        .string()
        .describe(
          "What you need from the file, like `Describe this screenshot and list any error messages in it.`",
        ),
    }),
    execute: async ({ path: reference, prompt }, { abortSignal }) => {
      const path = resolvePath(reference);
      const name = getFileName(path);
      let model: LanguageModel | undefined;
      try {
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
