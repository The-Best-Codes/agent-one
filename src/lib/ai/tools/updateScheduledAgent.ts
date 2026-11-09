import { tool } from "ai";
import { z } from "zod";

import {
  delayCutoffMinutesToSeconds,
  describeDelayCutoff,
  listScheduledAgents,
  setScheduledAgentEnabled,
  updateScheduledAgent,
} from "@/lib/cron";
import { describeSchedule } from "@/lib/cron-schedule";

export const createUpdateScheduledAgentTool = () =>
  tool({
    description:
      "Update, enable, or disable a scheduled agent. Only pass the fields you want to change; omitted fields keep their current values. Use listScheduledAgents first when the ID is unknown.",
    inputSchema: z.object({
      id: z.string().min(1).describe("The scheduled agent's ID, from listScheduledAgents."),
      title: z.string().min(1).optional().describe("A new concise, descriptive title."),
      schedule: z
        .string()
        .min(1)
        .optional()
        .describe("A new standard five-field cron expression, e.g. `0 9 * * 1`."),
      prompt: z
        .string()
        .min(1)
        .optional()
        .describe("The new complete prompt sent to the agent on each run. Replaces the old one."),
      enabled: z.boolean().optional().describe("true to enable the agent, false to pause it."),
      delayCutoffMinutes: z
        .number()
        .int()
        .min(0)
        .nullable()
        .optional()
        .describe(
          "Skip a run if it starts more than this many minutes late, e.g. because the computer was asleep or the app was closed. Use null to never skip late runs.",
        ),
    }),
    execute: async ({ id, title, schedule, prompt, enabled, delayCutoffMinutes }) => {
      const current = (await listScheduledAgents()).find((agent) => agent.id === id);
      if (!current) throw new Error(`Scheduled agent "${id}" was not found`);
      let updated = current;
      if (
        title !== undefined ||
        schedule !== undefined ||
        prompt !== undefined ||
        delayCutoffMinutes !== undefined
      ) {
        updated = await updateScheduledAgent(
          id,
          title ?? current.title,
          schedule ?? current.schedule,
          prompt ?? current.prompt,
          delayCutoffMinutes === undefined
            ? undefined
            : delayCutoffMinutesToSeconds(delayCutoffMinutes),
        );
      }
      if (enabled !== undefined && enabled !== updated.enabled) {
        updated = await setScheduledAgentEnabled(id, enabled);
      }
      return {
        ...updated,
        scheduleInfo: describeSchedule(updated.schedule),
        delayCutoffInfo: describeDelayCutoff(updated.delayCutoffSeconds),
      };
    },
  });
