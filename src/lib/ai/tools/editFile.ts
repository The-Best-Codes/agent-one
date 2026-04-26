import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { resolvePath } from "@/lib/ai/tools/utils/path";
import { getLogger } from "@/lib/logger";
import type { EditFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createEditFileTool = (config: EditFileToolConfig) =>
  tool({
    description:
      "Edit a file by applying a text replacement. Provide the file path, the old text to find, and the new text to replace it with.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Absolute path to the file to edit. `~` is expanded to the home directory."),
      oldContent: z.string().describe("The exact text content to find and replace"),
      newContent: z.string().describe("The new text content to replace with"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing editFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const filePath = await raceWithAbort(resolvePath(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      const fileContent = await raceWithAbort(readTextFile(filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (!fileContent.includes(input.oldContent)) {
        throw new Error("The specified oldContent was not found in the file.");
      }

      const updatedContent = fileContent.replace(input.oldContent, input.newContent);
      await raceWithAbort(writeTextFile(filePath, updatedContent), abortSignal);

      logger.verbose("File edited successfully:", filePath);

      return {};
    },
  });
