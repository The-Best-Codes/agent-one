import { tool } from "ai";
import { z } from "zod";

export const browse = tool({
  description: "Get the weather in a location (fahrenheit)",
  parameters: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => {
    const temperature = Math.round(Math.random() * (90 - 32) + 32);
    return {
      location,
      temperature,
    };
  },
});
