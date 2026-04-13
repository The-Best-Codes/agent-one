import { readTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
import { getLogger } from "@/lib/logger";
import type { ViewFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createViewFileTool = (config: ViewFileToolConfig) =>
  tool({
    description:
      "View the contents of a file. Supports reading specific line ranges and automatically truncates large files to avoid excessive output.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z.string().describe("Absolute path to the file to view"),
      maxChars: z.number().optional().describe("Optional override for max characters to return"),
      startLine: z.number().optional().describe("Optional 1-indexed line to start reading from"),
      endLine: z
        .number()
        .optional()
        .describe("Optional 1-indexed line to stop reading at (inclusive)"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing viewFile tool with input:", input);

      try {
        abortSignal?.addEventListener(
          "abort",
          () => {
            const abortError = new Error("The view file operation was aborted.");
            abortError.name = "AbortError";
            throw abortError;
          },
          { once: true },
        );

        const fileContent = await readTextFile(input.filePath);
        const allLines = fileContent.split("\n");
        const totalLines = allLines.length;
        const totalChars = fileContent.length;
        const maxChars = input.maxChars ?? config.defaultMaxChars;

        let selectedLines: string[];
        let actualStartLine: number;
        let actualEndLine: number;

        if (input.startLine !== undefined || input.endLine !== undefined) {
          actualStartLine = Math.max(1, input.startLine ?? 1);
          actualEndLine = Math.min(totalLines, input.endLine ?? totalLines);
          selectedLines = allLines.slice(actualStartLine - 1, actualEndLine);
        } else {
          actualStartLine = 1;
          actualEndLine = totalLines;
          selectedLines = allLines;
        }

        let content = selectedLines.join("\n");
        let truncated = false;

        if (content.length > maxChars) {
          truncated = true;
          const truncatedContent = content.slice(0, maxChars);
          const lastNewline = truncatedContent.lastIndexOf("\n");
          const slicedContent =
            lastNewline > 0 ? truncatedContent.slice(0, lastNewline) : truncatedContent;
          const shownLines = slicedContent.split("\n").length;
          actualEndLine = actualStartLine + shownLines - 1;
          content =
            slicedContent +
            `\n\n--- Content truncated. Showing ${slicedContent.length} of ${totalChars} characters (${totalLines} total lines). Use startLine/endLine to view specific sections. ---`;
        }

        logger.verbose("File viewed successfully:", input.filePath);

        return {
          success: true,
          filePath: input.filePath,
          content,
          totalLines,
          totalChars,
          truncated,
          startLine: actualStartLine,
          endLine: actualEndLine,
          schema: {
            success: "Whether the file was read successfully",
            filePath: "The path of the file that was read",
            content: "The file content, possibly truncated",
            totalLines: "Total number of lines in the file",
            totalChars: "Total number of characters in the file",
            truncated: "Whether the content was truncated",
            startLine: "The 1-indexed start line of the shown content",
            endLine: "The 1-indexed end line of the shown content",
          },
        };
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        logger.error("Error viewing file:", error);
        return {
          success: false,
          error: getError(error as Error),
          filePath: input.filePath,
          content: "",
          totalLines: 0,
          totalChars: 0,
          truncated: false,
          startLine: 0,
          endLine: 0,
          schema: {
            success: "Whether the file was read successfully",
            error: "Error message if the read failed",
            filePath: "The file path that was attempted to be read",
            content: "The file content (empty on failure)",
            totalLines: "Total number of lines in the file",
            totalChars: "Total number of characters in the file",
            truncated: "Whether the content was truncated",
            startLine: "The 1-indexed start line of the shown content",
            endLine: "The 1-indexed end line of the shown content",
          },
        };
      }
    },
  });
