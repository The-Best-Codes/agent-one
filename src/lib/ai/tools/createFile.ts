import { dirname } from "@tauri-apps/api/path";
import { exists, mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { resolvePath } from "@/lib/ai/tools/utils/path";
import { getLogger } from "@/lib/logger";
import type { CreateFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createCreateFileTool = (config: CreateFileToolConfig) =>
  tool({
    description:
      "Create a new file or overwrite an existing file with the given content. Prefer this tool over shell `cat`/`echo`/heredoc redirection for writing files.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe("Path for the file to create. `~` is expanded to the home directory."),
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

      const filePath = await raceWithAbort(resolvePath(input.filePath), abortSignal);

      abortSignal?.throwIfAborted();

      const fileExists = await raceWithAbort(exists(filePath), abortSignal);

      abortSignal?.throwIfAborted();

      if (fileExists && !input.overwrite) {
        throw new Error(
          "File already exists. Set overwrite to true to overwrite the existing file.",
        );
      }

      const createParentDirs = input.createParentDirs ?? true;

      if (createParentDirs && !fileExists) {
        const parentDir = await raceWithAbort(dirname(filePath), abortSignal);

        abortSignal?.throwIfAborted();

        const parentExists = await raceWithAbort(exists(parentDir), abortSignal);

        abortSignal?.throwIfAborted();

        if (!parentExists) {
          await raceWithAbort(mkdir(parentDir, { recursive: true }), abortSignal);
          abortSignal?.throwIfAborted();
        }
      }

      await raceWithAbort(writeTextFile(filePath, input.content), abortSignal);

      logger.verbose("File created successfully:", filePath);

      return {
        overwritten: fileExists,
      };
    },
  });
