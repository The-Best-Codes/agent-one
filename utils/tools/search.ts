import { withTimeout } from "@/utils/timeoutWrapper";
import { scrapeMojeekSearchResults } from "@/utils/tools/searchTool/index";
import { tool } from "ai";
import { z } from "zod";

const MAX_SEARCH_RESULTS = 5;

export const search = tool({
  description:
    "Search using search terms (not natural language). Returns a list of page titles, links, descriptions, and domains.",
  parameters: z.object({
    query: z.string().describe("The search query."),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const searchUrl = `https://www.mojeek.com/search?q=${
        encodeURIComponent(query)
      }`;
      const searchResults = await withTimeout(
        async () => await scrapeMojeekSearchResults(searchUrl),
        45000,
      );

      // Limit the number of results
      const limitedResults = searchResults.slice(0, MAX_SEARCH_RESULTS);

      return {
        results: limitedResults,
      };
    } catch (error: any) {
      console.error(`Error searching for ${query}: ${error.message}`);
      return {
        results: `Error searching for ${query}: ${error.message}`,
      };
    }
  },
});
