import { tool } from "ai";
import { z } from "zod";

import { createScheduledAgent } from "@/lib/cron";
import type { ScheduledAgentToolConfig } from "@/lib/settings/types";

export const createCreateScheduledAgentTool = (config: ScheduledAgentToolConfig) =>
  tool({
    description: "Create and enable a scheduled agent using a standard five-field cron expression.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      title: z.string().min(1).describe("A concise, descriptive title."),
      schedule: z.string().min(1).describe("A standard five-field cron expression."),
      prompt: z.string().min(1).describe("The complete prompt sent to the agent on each run."),
    }),
    execute: ({ title, schedule, prompt }) => createScheduledAgent(title, schedule, prompt),
  });
