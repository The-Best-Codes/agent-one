import { tool } from "ai";
import { z } from "zod";

import { describeDelayCutoff, listScheduledAgents } from "@/lib/cron";
import { describeSchedule } from "@/lib/cron-schedule";

export const createListScheduledAgentsTool = () =>
  tool({
    description:
      "List the user's scheduled agents, including their IDs, schedules, prompts, late-run cutoffs, and enabled state.",
    inputSchema: z.object({}),
    execute: async () => {
      const agents = await listScheduledAgents();
      return agents.map((agent) => ({
        ...agent,
        scheduleInfo: describeSchedule(agent.schedule),
        delayCutoffInfo: describeDelayCutoff(agent.delayCutoffSeconds),
      }));
    },
  });
