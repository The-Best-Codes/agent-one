import { tool } from "ai";
import { z } from "zod";

import type { DateTimeToolConfig } from "@/lib/settings/types";

export const createDateTimeTool = (config: DateTimeToolConfig) =>
  tool({
    description: `Get the current date and time${config.useUtc ? " in UTC" : " in local timezone"}`,
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async (input, { abortSignal }) => {
      void input;
      void abortSignal;

      const now = new Date();

      if (config.useUtc) {
        return { formatted: now.toUTCString() };
      }

      return { formatted: now.toLocaleString() };
    },
  });
