import { exists, remove } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/abort";
import { getLogger } from "@/lib/logger";
import type { DeleteFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createDeleteFileTool = (config: DeleteFileToolConfig) =>
  tool({
    description: "Delete a file from the filesystem.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z.string().describe("Absolute path to the file to delete"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing deleteFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const fileExists = await raceWithAbort(exists(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (!fileExists) {
        throw new Error("File does not exist.");
      }

      await raceWithAbort(remove(input.filePath), abortSignal);

      logger.verbose("File deleted successfully:", input.filePath);

      return {};
    },
  });
