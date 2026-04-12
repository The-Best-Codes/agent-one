import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
import { getLogger } from "@/lib/logger";
import type { EditFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createEditFileTool = (config: EditFileToolConfig) =>
  tool({
    description:
      "Edit a file by applying a text replacement. Provide the file path, the old text to find, and the new text to replace it with.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z.string().describe("Absolute path to the file to edit"),
      oldContent: z.string().describe("The exact text content to find and replace"),
      newContent: z.string().describe("The new text content to replace with"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing editFile tool with input:", input);

      try {
        abortSignal?.addEventListener(
          "abort",
          () => {
            const abortError = new Error("The edit file operation was aborted.");
            abortError.name = "AbortError";
            throw abortError;
          },
          { once: true },
        );

        const fileContent = await readTextFile(input.filePath);

        if (!fileContent.includes(input.oldContent)) {
          return {
            success: false,
            error: "The specified oldContent was not found in the file.",
            filePath: input.filePath,
            schema: {
              success: "Whether the edit completed successfully",
              error: "Error message if the edit failed",
              filePath: "The file path that was attempted to be edited",
            },
          };
        }

        const updatedContent = fileContent.replace(input.oldContent, input.newContent);
        await writeTextFile(input.filePath, updatedContent);

        const oldLines = input.oldContent.split("\n").length;
        const newLines = input.newContent.split("\n").length;
        const linesChanged = Math.abs(newLines - oldLines) || oldLines;

        logger.verbose("File edited successfully:", input.filePath);

        return {
          success: true,
          filePath: input.filePath,
          linesChanged,
          oldContent: input.oldContent,
          newContent: input.newContent,
          schema: {
            success: "Whether the edit completed successfully",
            filePath: "The path of the file that was edited",
            linesChanged: "The number of lines affected by the edit",
            oldContent: "The original text that was replaced",
            newContent: "The new text that was inserted",
          },
        };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        logger.error("Error editing file:", error);
        return {
          success: false,
          error: getError(error as Error),
          filePath: input.filePath,
          schema: {
            success: "Whether the edit completed successfully",
            error: "Error message if the edit failed",
            filePath: "The file path that was attempted to be edited",
          },
        };
      }
    },
  });
