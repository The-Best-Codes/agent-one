import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { getLogger } from "@/lib/logger";
import type { WebSearchToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  display_url: string;
}

interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
  search_url: string;
}

export const createWebSearchTool = (config: WebSearchToolConfig) =>
  tool({
    description:
      "Search the web for current information, news, and answers to questions using DuckDuckGo. Returns real-time search results with titles, URLs, and snippets.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      query: z.string().min(1).max(512).describe("Search query to find information on the web"),
      maxResults: z
        .number()
        .min(1)
        .max(200)
        .default(config.defaultMaxResults)
        .describe("Maximum number of search results to return"),
      maxPages: z
        .number()
        .min(1)
        .max(20)
        .default(config.defaultMaxPages)
        .describe("Maximum number of search result pages to view (more than 1 may take longer)"),
      timeoutSeconds: z
        .number()
        .min(1)
        .max(60)
        .default(5)
        .optional()
        .describe("Timeout in seconds for the search request"),
      useWebview: z
        .boolean()
        .default(false)
        .optional()
        .describe(
          "Whether to use webview to avoid bot detection, not recommended unless bot detection issues repeatedly occur",
        ),
    }),
    execute: async (input, { abortSignal }) => {
      abortSignal?.throwIfAborted();

      const timeoutMs = (input.timeoutSeconds || 5) * 1000 + 8000;

      logger.verbose("Executing webSearch tool with input:", input);

      let timeoutId: NodeJS.Timeout | undefined = undefined;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          logger.error("Timeout reached:", timeoutMs);
          reject(new Error("Frontend timeout: Search operation exceeded allowed time."));
        }, timeoutMs);
      });

      try {
        const searchPromise = raceWithAbort(
          invoke<WebSearchResponse>("web_search", {
            query: input.query,
            maxResults: input.maxResults,
            maxPages: input.maxPages,
            timeoutSeconds: input.timeoutSeconds,
            useWebview: input.useWebview,
          }),
          abortSignal,
        );

        const result = await Promise.race([searchPromise, timeoutPromise]);

        logger.verbose("Search completed:", {
          query: result.query,
          totalResults: result.total_results,
          resultCount: result.results.length,
        });

        return {
          query: result.query,
          total_results: result.total_results,
          results: result.results.map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            display_url: r.display_url,
          })),
          search_url: result.search_url,
        };
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    },
  });
