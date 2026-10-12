import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { resolvePath } from "@/lib/ai/tools/utils/path";
import { getLogger } from "@/lib/logger";
import {
  describeSandboxFileTool,
  readSandboxFileWithPath,
  writeSandboxFile,
} from "@/lib/openshell";
import type { EditFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createEditFileTool = (config: EditFileToolConfig, sandboxed = false) =>
  tool({
    description: describeSandboxFileTool(
      "Edit a file by applying a text replacement. Provide the file path, the old text to find, and the new text to replace it with.",
      sandboxed,
    ),
    needsApproval: config.requiresApproval,
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

      const { path: filePath, content: fileContent } = await raceWithAbort(
        sandboxed
          ? readSandboxFileWithPath(input.filePath)
          : resolvePath(input.filePath).then(async (path) => ({
              path,
              content: await readTextFile(path),
            })),
        abortSignal,
      );

      abortSignal?.throwIfAborted();

      if (!fileContent.includes(input.oldContent)) {
        throw new Error("The specified oldContent was not found in the file.");
      }

      const updatedContent = fileContent.replace(input.oldContent, input.newContent);
      await raceWithAbort(
        sandboxed
          ? writeSandboxFile(filePath, updatedContent)
          : writeTextFile(filePath, updatedContent),
        abortSignal,
      );

      logger.verbose("File edited successfully:", filePath);

      return {};
    },
  });
