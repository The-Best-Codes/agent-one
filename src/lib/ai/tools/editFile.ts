import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/abort";
import { getLogger } from "@/lib/logger";
import type { EditFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createEditFileTool = (config: EditFileToolConfig) =>
  tool({
    description:
      "Edit a file by applying a text replacement. Provide the file path, the old text to find, and the new text to replace it with. Always pass a real absolute path: do not assume `~` expands to a particular directory (e.g. do not assume it is `/root`). If you need the user's home directory, run a command like `echo $HOME` or `pwd` first to discover the real path instead of guessing.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe(
          "Absolute path to the file to edit. Do not use `~` or assume the home directory; resolve it first via a shell command if unknown.",
        ),
      oldContent: z.string().describe("The exact text content to find and replace"),
      newContent: z.string().describe("The new text content to replace with"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing editFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const fileContent = await raceWithAbort(readTextFile(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (!fileContent.includes(input.oldContent)) {
        throw new Error("The specified oldContent was not found in the file.");
      }

      const updatedContent = fileContent.replace(input.oldContent, input.newContent);
      await raceWithAbort(writeTextFile(input.filePath, updatedContent), abortSignal);

      logger.verbose("File edited successfully:", input.filePath);

      return {};
    },
  });
