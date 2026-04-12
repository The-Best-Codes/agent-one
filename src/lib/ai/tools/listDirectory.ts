import { readDir, stat } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
import { getLogger } from "@/lib/logger";
import type { ListDirectoryToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createListDirectoryTool = (config: ListDirectoryToolConfig) =>
  tool({
    description:
      "List the files and directories in a given directory path. Can optionally include file sizes and modification times.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      dirPath: z.string().describe("Absolute path to the directory to list"),
      includeDetails: z
        .boolean()
        .default(false)
        .optional()
        .describe("Whether to include file size and modification time for each entry"),
      limit: z
        .number()
        .min(1)
        .max(1000)
        .default(200)
        .optional()
        .describe("Maximum number of entries to return"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing listDirectory tool with input:", input);

      try {
        abortSignal?.addEventListener(
          "abort",
          () => {
            const abortError = new Error("The list directory operation was aborted.");
            abortError.name = "AbortError";
            throw abortError;
          },
          { once: true },
        );

        const entries = await readDir(input.dirPath);
        const limit = input.limit || 200;
        const limited = entries.slice(0, limit);

        if (!input.includeDetails) {
          const items = limited.map((entry) => ({
            name: entry.name,
            isDirectory: entry.isDirectory,
            isFile: entry.isFile,
            isSymlink: entry.isSymlink,
          }));

          return {
            success: true,
            dirPath: input.dirPath,
            totalEntries: entries.length,
            returnedEntries: items.length,
            truncated: entries.length > limit,
            entries: items,
            schema: {
              success: "Whether the directory listing completed successfully",
              dirPath: "The directory that was listed",
              totalEntries: "Total number of entries in the directory",
              returnedEntries: "Number of entries returned (may be limited)",
              truncated: "Whether the results were truncated due to the limit",
              entries: "Array of directory entries with name, isDirectory, isFile, isSymlink",
            },
          };
        }

        const detailedItems = await Promise.all(
          limited.map(async (entry) => {
            const fullPath = input.dirPath.replace(/\/$/, "") + "/" + entry.name;
            try {
              const info = await stat(fullPath);
              return {
                name: entry.name,
                isDirectory: entry.isDirectory,
                isFile: entry.isFile,
                isSymlink: entry.isSymlink,
                size: info.size,
                modifiedAt: info.mtime ? new Date(info.mtime).toISOString() : undefined,
              };
            } catch {
              return {
                name: entry.name,
                isDirectory: entry.isDirectory,
                isFile: entry.isFile,
                isSymlink: entry.isSymlink,
              };
            }
          }),
        );

        return {
          success: true,
          dirPath: input.dirPath,
          totalEntries: entries.length,
          returnedEntries: detailedItems.length,
          truncated: entries.length > limit,
          entries: detailedItems,
          schema: {
            success: "Whether the directory listing completed successfully",
            dirPath: "The directory that was listed",
            totalEntries: "Total number of entries in the directory",
            returnedEntries: "Number of entries returned (may be limited)",
            truncated: "Whether the results were truncated due to the limit",
            entries:
              "Array of directory entries with name, type info, and optionally size and modifiedAt",
          },
        };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        logger.error("Error listing directory:", error);
        return {
          success: false,
          error: getError(error as Error),
          dirPath: input.dirPath,
          schema: {
            success: "Whether the directory listing completed successfully",
            error: "Error message if the listing failed",
            dirPath: "The directory path that was attempted to be listed",
          },
        };
      }
    },
  });
