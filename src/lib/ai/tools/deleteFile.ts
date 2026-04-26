import { exists, remove } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { resolvePath } from "@/lib/ai/tools/utils/path";
import { getLogger } from "@/lib/logger";
import type { DeleteFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createDeleteFileTool = (config: DeleteFileToolConfig) =>
  tool({
    description: "Delete a file from the filesystem.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Absolute path to the file to delete. `~` is expanded to the home directory."),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing deleteFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const filePath = await raceWithAbort(resolvePath(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      const fileExists = await raceWithAbort(exists(filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (!fileExists) {
        throw new Error("File does not exist.");
      }

      await raceWithAbort(remove(filePath), abortSignal);

      logger.verbose("File deleted successfully:", filePath);

      return {};
    },
  });
