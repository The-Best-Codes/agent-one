import { tool } from "ai";
import { z } from "zod";

const MAX_SEARCH_RESULTS = 5;

export const search = tool({
  description: "Search the web for information.",
  parameters: z.object({
    query: z.string().describe("The search query."),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const response = await fetch(
        `https://search-engines-api.vercel.app/api/scrape/bing/search?query=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        console.error(
          `Failed to search for ${query}: ${response.status} ${response.statusText}`,
        );
        return {
          results: `Failed to search for ${query}. Status: ${response.status} ${response.statusText}`,
        };
      }

      const data = (await response.json()) as any[];
      const results = data; // May implement processing logic here later

      return {
        results: results,
      };
    } catch (error: any) {
      console.error(`Error searching for ${query}: ${error.message}`);
      return {
        results: `Error searching for ${query}: ${error.message}`,
      };
    }
  },
});
