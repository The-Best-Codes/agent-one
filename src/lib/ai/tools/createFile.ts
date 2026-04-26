import { dirname } from "@tauri-apps/api/path";
import { exists, mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/abort";
import { getLogger } from "@/lib/logger";
import type { CreateFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createCreateFileTool = (config: CreateFileToolConfig) =>
  tool({
    description:
      "Create a new file or overwrite an existing file with the given content. Prefer this tool over shell `cat`/`echo`/heredoc redirection for writing files. Always pass a real absolute path: do not assume `~` expands to a particular directory (e.g. do not assume it is `/root`). If you need the user's home directory, run a command like `echo $HOME` or `pwd` first to discover the real path instead of guessing.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe(
          "Absolute path for the file to create. Do not use `~` or assume the home directory; resolve it first via a shell command if unknown.",
        ),
      content: z.string().describe("Content to write to the file"),
      overwrite: z
        .boolean()
        .default(false)
        .optional()
        .describe("Whether to overwrite if the file already exists"),
      createParentDirs: z
        .boolean()
        .default(true)
        .optional()
        .describe(
          "Whether to create parent directories if they don't already exist. Defaults to true.",
        ),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing createFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const fileExists = await raceWithAbort(exists(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (fileExists && !input.overwrite) {
        throw new Error(
          "File already exists. Set overwrite to true to overwrite the existing file.",
        );
      }

      const createParentDirs = input.createParentDirs ?? true;

      if (createParentDirs && !fileExists) {
        const parentDir = await raceWithAbort(dirname(input.filePath), abortSignal);

        abortSignal?.throwIfAborted();

        const parentExists = await raceWithAbort(exists(parentDir), abortSignal);

        abortSignal?.throwIfAborted();

        if (!parentExists) {
          await raceWithAbort(mkdir(parentDir, { recursive: true }), abortSignal);
          abortSignal?.throwIfAborted();
        }
      }

      await raceWithAbort(writeTextFile(input.filePath, input.content), abortSignal);

      logger.verbose("File created successfully:", input.filePath);

      return {
        overwritten: fileExists,
      };
    },
  });
