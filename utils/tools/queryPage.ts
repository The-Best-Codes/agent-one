import { withTimeout } from "@/utils/timeoutWrapper";
import { scrapePageContent } from "@/utils/tools/queryPageTool/index";
import { tool } from "ai";
import { z } from "zod";

export const queryPage = tool({
  description:
    "Loads a specific URL and extracts content using a custom query selector. Returns the HTML content of the element(s) matching the selector.",
  parameters: z.object({
    url: z
      .string()
      .describe("The URL to load, including the protocol (e.g., https://)."),
    selector: z
      .string()
      .describe(
        "The query selector to use to extract content from the page, like you would use in Puppeteer.",
      ),
  }),
  execute: async ({ url, selector }: { url: string; selector: string }) => {
    try {
      const pageContent = await withTimeout(
        async () => await scrapePageContent(url, selector),
        45000,
      );

      return {
        result: pageContent,
      };
    } catch (error: any) {
      console.error(
        `Error querying page ${url} with selector ${selector}: ${error.message}`,
      );
      return {
        result: `Error querying page ${url} with selector ${selector}: ${error.message}`,
      };
    }
  },
});
