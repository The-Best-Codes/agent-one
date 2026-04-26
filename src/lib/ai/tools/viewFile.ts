import { readTextFile } from "@tauri-apps/plugin-fs";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/abort";
import { getLogger } from "@/lib/logger";
import type { ViewFileToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export const createViewFileTool = (config: ViewFileToolConfig) =>
  tool({
    description:
      "View the contents of a file. Supports reading specific line ranges and automatically truncates large files to avoid excessive output. Always pass a real absolute path: do not assume `~` expands to a particular directory (e.g. do not assume it is `/root`). If you need the user's home directory, run a command like `echo $HOME` or `pwd` first to discover the real path instead of guessing.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      filePath: z
        .string()
        .describe(
          "Absolute path to the file to view. Do not use `~` or assume the home directory; resolve it first via a shell command if unknown.",
        ),
      maxChars: z.number().optional().describe("Optional override for max characters to return"),
      startLine: z.number().optional().describe("Optional 1-indexed line to start reading from"),
      endLine: z
        .number()
        .optional()
        .describe("Optional 1-indexed line to stop reading at (inclusive)"),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing viewFile tool with input:", input);

      abortSignal?.throwIfAborted();

      const fileContent = await raceWithAbort(readTextFile(input.filePath), abortSignal);
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
        content,
        totalLines,
        totalChars,
        truncated,
        startLine: actualStartLine,
        endLine: actualEndLine,
      };
    },
  });
