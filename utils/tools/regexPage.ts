import { withTimeout } from "@/utils/timeoutWrapper";
import { regexSearchPageContent } from "@/utils/tools/regexPageTool";
import { tool } from "ai";
import { z } from "zod";

export const regexPage = tool({
  description:
    "Loads a specific URL and searches its text content using a regular expression. Returns an array of matching strings.",
  parameters: z.object({
    url: z
      .string()
      .describe("The URL to load, including the protocol (e.g., https://)."),
    regex: z
      .string()
      .describe(
        "The regular expression to use to search the page text content. Must be a valid JavaScript regex.",
      ),
  }),
  execute: async ({ url, regex }: { url: string; regex: string }) => {
    try {
      const matches = await withTimeout(
        async () => await regexSearchPageContent(url, regex),
        45000,
      );

      return {
        result: matches,
      };
    } catch (error: any) {
      console.error(
        `Error searching page ${url} with regex ${regex}: ${error.message}`,
      );
      return {
        result:
          `Error searching page ${url} with regex ${regex}: ${error.message}`,
      };
    }
  },
});
