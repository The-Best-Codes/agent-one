import { tool } from "ai";
import { z } from "zod";

export const browse = tool({
  description: "Browse the content of a webpage.",
  parameters: z.object({
    // WARNING: ADDING .url() CAUSES AN ERROR WITH NO LOGS
    url: z.string().describe("The URL of the webpage to browse."),
  }),
  execute: async ({ url }: { url: string }) => {
    // Placeholder implementation - replace with actual browsing logic
    console.log(`Browsing URL: ${url}`);
    const content = `Content of ${url}: This is placeholder content. Implement the actual browsing logic to fetch the content.`;

    return {
      content,
    };
  },
});
