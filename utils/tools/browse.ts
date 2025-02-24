import { scrapePageToMarkdown } from "@/utils/tools/browse/index";
import { tool } from "ai";
import { z } from "zod";

export const browse = tool({
  description: "Browse the content of a webpage.",
  parameters: z.object({
    url: z
      .string()
      .describe(
        "The URL of the webpage to browse, including the protocol (e.g., https://).",
      ),
  }),
  execute: async ({ url }: { url: string }) => {
    try {
      const content = await scrapePageToMarkdown(url);

      return {
        content,
      };
    } catch (error: any) {
      console.error(`Error browsing ${url}: ${error.message}`);
      return {
        content: `Error browsing ${url}: ${error.message}`,
      };
    }
  },
});
