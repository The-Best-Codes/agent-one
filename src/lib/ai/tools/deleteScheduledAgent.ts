import { tool } from "ai";
import { z } from "zod";

import { deleteScheduledAgent } from "@/lib/cron";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createDeleteScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "Permanently delete a scheduled agent. Existing chats created by it are preserved.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({ id: z.string().min(1) }),
    execute: async ({ id }) => {
      await deleteScheduledAgent(id);
      return { id, success: true };
    },
  });
