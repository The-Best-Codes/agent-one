import { tool } from "ai";
import { z } from "zod";

import {
  createScheduledAgent,
  deleteScheduledAgent,
  listScheduledAgents,
  setScheduledAgentEnabled,
  updateScheduledAgent,
} from "@/lib/cron";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createListScheduledAgentsTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "List the user's scheduled agents, including their IDs, schedules, prompts, and enabled state.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: listScheduledAgents,
  });

export const createCreateScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description:
      "Create and enable a scheduled agent using a standard five-field cron expression in the user's local timezone.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      title: z.string().min(1).describe("A concise, descriptive title."),
      schedule: z.string().min(1).describe("A standard five-field cron expression."),
      prompt: z.string().min(1).describe("The complete prompt sent to the agent on each run."),
    }),
    execute: ({ title, schedule, prompt }) => createScheduledAgent(title, schedule, prompt),
  });

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
      enabled: z.boolean().optional().describe("Enable or disable the scheduled agent."),
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
      return updated;
    },
  });

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
