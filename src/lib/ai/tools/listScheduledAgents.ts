import { tool } from "ai";
import { z } from "zod";

import { listScheduledAgents } from "@/lib/cron";
import { describeSchedule } from "@/lib/cron-schedule";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createListScheduledAgentsTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "List the user's scheduled agents, including their IDs, schedules, prompts, and enabled state.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => {
      const agents = await listScheduledAgents();
      return agents.map((agent) => ({
        ...agent,
        scheduleInfo: describeSchedule(agent.schedule),
      }));
    },
  });
