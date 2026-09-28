import { tool } from "ai";
import { z } from "zod";

import { deleteScheduledAgent } from "@/lib/cron";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createDeleteScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "Permanently delete a scheduled agent. Existing chats created by it are preserved. Always pass the agent's display title alongside the id so the deletion can be shown by name; use listScheduledAgents first when the title is unknown.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      id: z.string().min(1),
      title: z
        .string()
        .min(1)
        .describe("The scheduled agent's display title, for confirmation display."),
    }),
    execute: async ({ id, title }) => {
      await deleteScheduledAgent(id);
      return { id, title, success: true };
    },
  });
