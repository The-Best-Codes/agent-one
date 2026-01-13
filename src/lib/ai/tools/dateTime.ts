import { tool } from "ai";
import { z } from "zod";

import { type DateTimeToolConfig } from "@/lib/settings/types";

export const createDateTimeTool = (config: DateTimeToolConfig) =>
  tool({
    description: "Get the current date and time",
    inputSchema: z.object({}),
    execute: async (input, { abortSignal }) => {
      void input;
      void abortSignal;

      const now = new Date();

      if (config.useUtc) {
        return {
          dateTime: now.toISOString(),
          formatted: now.toUTCString(),
          timezone: "UTC",
          schema: {
            dateTime: "The current date and time in ISO 8601 format (UTC)",
            formatted:
              "The current date and time in a human-readable format (UTC)",
            timezone: "The timezone used (UTC)",
          },
        };
      }

      return {
        dateTime: now.toISOString(),
        formatted: now.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        schema: {
          dateTime: "The current date and time in ISO 8601 format",
          formatted: "The current date and time in a human-readable format",
          timezone: "The local timezone used",
        },
      };
    },
  });
