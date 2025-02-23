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
      const response = await fetch(
        `https://search-engines-api.vercel.app/api/scrape/page-to-markdown?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        console.error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
        );
        return {
          content: `Failed to browse ${url}. Status: ${response.status} ${response.statusText}`,
        };
      }
      const content = await response.text();
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
