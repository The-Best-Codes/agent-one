import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { resolveToolPath } from "@/lib/ai/tools/utils/path";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export const createEditFileTool = (baseDir?: string) =>
  tool({
    description:
      "Edit a file by applying a text replacement. Provide the file path, the old text to find, and the new text to replace it with.",
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Path to the file to edit. `~` is expanded to the home directory."),
      oldContent: z.string().describe("The exact text content to find and replace"),
      newContent: z.string().describe("The new text content to replace with"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing editFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const filePath = await raceWithAbort(resolveToolPath(input.filePath, baseDir), abortSignal);

      abortSignal?.throwIfAborted();

      const fileContent = await raceWithAbort(readTextFile(filePath), abortSignal);

      abortSignal?.throwIfAborted();

      let { oldContent, newContent } = input;
      if (!fileContent.includes(oldContent) && fileContent.includes("\r\n")) {
        const toCrlf = (text: string) => text.replace(/\r?\n/g, "\r\n");
        if (fileContent.includes(toCrlf(oldContent))) {
          oldContent = toCrlf(oldContent);
          newContent = toCrlf(newContent);
        }
      }

      if (!fileContent.includes(oldContent)) {
        throw new Error("The specified oldContent was not found in the file.");
      }

      const updatedContent = fileContent.replace(oldContent, () => newContent);
      await raceWithAbort(writeTextFile(filePath, updatedContent), abortSignal);

      logger.verbose("File edited successfully:", filePath);

      return {};
    },
  });
