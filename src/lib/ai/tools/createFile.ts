import { exists, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getLogger } from "@/lib/logger";
import type { CreateFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createCreateFileTool = (config: CreateFileToolConfig) =>
  tool({
    description: "Create a new file or overwrite an existing file with the given content.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z.string().describe("Absolute path for the file to create"),
      content: z.string().describe("Content to write to the file"),
      overwrite: z
        .boolean()
        .default(false)
        .optional()
        .describe("Whether to overwrite if the file already exists"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing createFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const fileExists = await exists(input.filePath);

      abortSignal?.throwIfAborted();

      if (fileExists && !input.overwrite) {
        throw new Error(
          "File already exists. Set overwrite to true to overwrite the existing file.",
        );
      }

      await writeTextFile(input.filePath, input.content);

      logger.verbose("File created successfully:", input.filePath);

      return {
        overwritten: fileExists,
      };
    },
  });
