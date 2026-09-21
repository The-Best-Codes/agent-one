import { tool } from "ai";
import { z } from "zod";

import { listScheduledAgents } from "@/lib/cron";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createListScheduledAgentsTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "List the user's scheduled agents, including their IDs, schedules, prompts, and enabled state.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: listScheduledAgents,
  });
