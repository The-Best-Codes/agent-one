import { exists, remove } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
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

      try {
        abortSignal?.addEventListener(
          "abort",
          () => {
            const abortError = new Error("The delete file operation was aborted.");
            abortError.name = "AbortError";
            throw abortError;
          },
          { once: true },
        );

        const fileExists = await exists(input.filePath);

        if (!fileExists) {
          return {
            success: false,
            error: "File does not exist.",
            filePath: input.filePath,
            schema: {
              success: "Whether the file was deleted successfully",
              error: "Error message if the deletion failed",
              filePath: "The file path that was attempted to be deleted",
            },
          };
        }

        await remove(input.filePath);

        logger.verbose("File deleted successfully:", input.filePath);

        return {
          success: true,
          filePath: input.filePath,
          schema: {
            success: "Whether the file was deleted successfully",
            filePath: "The path of the file that was deleted",
          },
        };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        logger.error("Error deleting file:", error);
        return {
          success: false,
          error: getError(error as Error),
          filePath: input.filePath,
          schema: {
            success: "Whether the file was deleted successfully",
            error: "Error message if the deletion failed",
            filePath: "The file path that was attempted to be deleted",
          },
        };
      }
    },
  });
