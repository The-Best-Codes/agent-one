import { exists, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
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

      try {
        abortSignal?.addEventListener(
          "abort",
          () => {
            const abortError = new Error("The create file operation was aborted.");
            abortError.name = "AbortError";
            throw abortError;
          },
          { once: true },
        );

        const fileExists = await exists(input.filePath);

        if (fileExists && !input.overwrite) {
          return {
            success: false,
            error: "File already exists. Set overwrite to true to overwrite the existing file.",
            filePath: input.filePath,
            schema: {
              success: "Whether the file was created successfully",
              error: "Error message if the file creation failed",
              filePath: "The file path that was attempted to be created",
            },
          };
        }

        await writeTextFile(input.filePath, input.content);

        const bytesWritten = new TextEncoder().encode(input.content).length;

        logger.verbose("File created successfully:", input.filePath);

        return {
          success: true,
          filePath: input.filePath,
          bytesWritten,
          overwritten: fileExists,
          content: input.content,
          schema: {
            success: "Whether the file was created successfully",
            filePath: "The path of the file that was created",
            bytesWritten: "The number of bytes written to the file",
            overwritten: "Whether an existing file was overwritten",
            content: "The content that was written to the file",
          },
        };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        logger.error("Error creating file:", error);
        return {
          success: false,
          error: getError(error as Error),
          filePath: input.filePath,
          schema: {
            success: "Whether the file was created successfully",
            error: "Error message if the file creation failed",
            filePath: "The file path that was attempted to be created",
          },
        };
      }
    },
  });
