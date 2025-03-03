import { withTimeout } from "@/utils/timeoutWrapper";
import { scrapePageToMarkdown } from "@/utils/tools/readSiteTool/index";
import { tool } from "ai";
import { z } from "zod";

export const readSite = tool({
  description: "Browse a URL and return its content as Markdown.",
  parameters: z.object({
    url: z
      .string()
      .describe(
        "The URL of the webpage to browse, including the protocol (e.g., https://).",
      ),
  }),
  execute: async ({ url }: { url: string }) => {
    try {
      const content = await withTimeout(
        async () => await scrapePageToMarkdown(url),
        45000,
      );

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
