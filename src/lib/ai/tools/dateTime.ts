import { tool } from "ai";
import { z } from "zod";

export const DateTimeTool = tool({
  description: "Get the current date and time",
  inputSchema: z.object({}),
  execute: async (input, { abortSignal }) => {
    void input; // Ignore input parameter
    void abortSignal; // Unused for now

    const now = new Date();
    return {
      dateTime: now.toISOString(),
      formatted: now.toLocaleString(),
      schema: {
        dateTime: "The current date and time in ISO 8601 format",
        formatted: "The current date and time in a human-readable format",
      },
    };
  },
});
