import { exists, remove } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/abort";
import { getLogger } from "@/lib/logger";
import type { DeleteFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createDeleteFileTool = (config: DeleteFileToolConfig) =>
  tool({
    description:
      "Delete a file from the filesystem. Always pass a real absolute path: do not assume `~` expands to a particular directory (e.g. do not assume it is `/root`). If you need the user's home directory, run a command like `echo $HOME` or `pwd` first to discover the real path instead of guessing.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe(
          "Absolute path to the file to delete. Do not use `~` or assume the home directory; resolve it first via a shell command if unknown.",
        ),
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
