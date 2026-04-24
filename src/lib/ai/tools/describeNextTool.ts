import { tool } from "ai";
import { z } from "zod";

export interface ToolDisplayLabels {
  loadingTitle?: string;
  completedTitle?: string;
  errorTitle?: string;
}

const pendingLabels = new Map<string, ToolDisplayLabels>();

export function getPendingToolDisplayLabels(): ToolDisplayLabels | undefined {
  if (pendingLabels.size === 0) return undefined;
  const firstKey = pendingLabels.keys().next().value!;
  const labels = pendingLabels.get(firstKey);
  pendingLabels.delete(firstKey);
  return labels;
}

export const createDescribeNextToolTool = () =>
  tool({
    description:
      "Describe the next tool call with user-friendly display labels. Call this immediately before calling any MCP tool to provide human-readable loading, completed, and error messages instead of showing the raw tool name.",
    needsApproval: false,
    inputSchema: z.object({
      loadingTitle: z
        .string()
        .optional()
        .describe('User-friendly loading message, e.g. "Searching for information about cats"'),
      completedTitle: z
        .string()
        .optional()
        .describe('User-friendly completed message, e.g. "Searched for information about cats"'),
      errorTitle: z
        .string()
        .optional()
        .describe(
          'User-friendly error message, e.g. "Couldn\'t search for information about cats"',
        ),
    }),
    execute: async (input) => {
      const id = `describe-${Date.now()}-${Math.random()}`;
      pendingLabels.set(id, {
        loadingTitle: input.loadingTitle,
        completedTitle: input.completedTitle,
        errorTitle: input.errorTitle,
      });
      return { success: true };
    },
  });
