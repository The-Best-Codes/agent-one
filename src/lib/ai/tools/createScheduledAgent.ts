import { tool } from "ai";
import { z } from "zod";

import { createScheduledAgent, delayCutoffMinutesToSeconds, describeDelayCutoff } from "@/lib/cron";
import { describeSchedule } from "@/lib/cron-schedule";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createCreateScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description: "Create and enable a scheduled agent using a standard five-field cron expression.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      title: z.string().min(1).describe("A concise, descriptive title."),
      schedule: z.string().min(1).describe("A standard five-field cron expression."),
      prompt: z.string().min(1).describe("The complete prompt sent to the agent on each run."),
      delayCutoffMinutes: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional()
        .describe(
          "Skip a run if it starts more than this many minutes late, e.g. because the computer was asleep or the app was closed. Use null to never skip late runs. Defaults to 5.",
        ),
    }),
    execute: async ({ title, schedule, prompt, delayCutoffMinutes }) => {
      const agent = await createScheduledAgent(
        title,
        schedule,
        prompt,
        delayCutoffMinutes === undefined
          ? undefined
          : delayCutoffMinutesToSeconds(delayCutoffMinutes),
      );
      return {
        ...agent,
        scheduleInfo: describeSchedule(agent.schedule),
        delayCutoffInfo: describeDelayCutoff(agent.delayCutoffSeconds),
      };
    },
  });
