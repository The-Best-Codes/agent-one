import { scrapeGoogleSearchResults } from "@/utils/tools/search/index";
import { tool } from "ai";
import { z } from "zod";
const MAX_SEARCH_RESULTS = 5;

export const search = tool({
  description: "Search the web for information using Google.",
  parameters: z.object({
    query: z.string().describe("The search query."),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      const searchResults = await scrapeGoogleSearchResults(searchUrl);

      // Limit the number of results (optional)
      const limitedResults = searchResults.slice(0, MAX_SEARCH_RESULTS);

      console.log(limitedResults);

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
