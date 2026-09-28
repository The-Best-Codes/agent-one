import { tool } from "ai";
import { z } from "zod";

import { listScheduledAgents, setScheduledAgentEnabled, updateScheduledAgent } from "@/lib/cron";
import { describeSchedule } from "@/lib/cron-schedule";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createUpdateScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "Update, enable, or disable a scheduled agent. Use listScheduledAgents first when the ID is unknown.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      id: z.string().min(1),
      title: z.string().min(1).optional(),
      schedule: z.string().min(1).optional(),
      prompt: z.string().min(1).optional(),
      enabled: z.boolean().optional(),
    }),
    execute: async ({ id, title, schedule, prompt, enabled }) => {
      const current = (await listScheduledAgents()).find((agent) => agent.id === id);
      if (!current) throw new Error(`Scheduled agent "${id}" was not found`);
      let updated = current;
      if (title !== undefined || schedule !== undefined || prompt !== undefined) {
        updated = await updateScheduledAgent(
          id,
          title ?? current.title,
          schedule ?? current.schedule,
          prompt ?? current.prompt,
        );
      }
      if (enabled !== undefined && enabled !== updated.enabled) {
        updated = await setScheduledAgentEnabled(id, enabled);
      }
      return { ...updated, scheduleInfo: describeSchedule(updated.schedule) };
    },
  });
