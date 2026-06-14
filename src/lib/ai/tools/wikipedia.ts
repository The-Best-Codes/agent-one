import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { getLogger } from "@/lib/logger";
import type { WikipediaToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

const API = "https://en.wikipedia.org/w/api.php";

const HEADERS = {
  "User-Agent": "AgentOne/1.0 (https://github.com/The-Best-Codes/agent-one)",
};

async function api(params: Record<string, string>, abortSignal?: AbortSignal): Promise<unknown> {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  const res = await raceWithAbort(fetch(url, { headers: HEADERS }), abortSignal);
  if (!res.ok) throw new Error(`Wikipedia API: ${res.status} ${res.statusText}`);
  return res.json();
}

export const createWikipediaTool = (config: WikipediaToolConfig) =>
  tool({
    description:
      "Interact with Wikipedia: 'search' finds articles by keyword, 'getSummary' returns the intro paragraph, 'getContent' returns full plain text, 'getLinks' lists internal links, 'getCategories' lists categories.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      action: z
        .enum(["search", "getSummary", "getContent", "getLinks", "getCategories"])
        .describe("Action to perform on Wikipedia"),
      query: z.string().min(1).max(512).optional().describe("Search query (required for 'search')"),
      title: z
        .string()
        .min(1)
        .max(512)
        .optional()
        .describe("Article title (required for all actions except 'search')"),
      maxResults: z
        .number()
        .min(1)
        .max(config.defaultMaxResults)
        .default(config.defaultMaxResults)
        .optional()
        .describe("Maximum number of results"),
    }),
    execute: async (input, { abortSignal }) => {
      abortSignal?.throwIfAborted();
      logger.verbose("Executing wikipedia tool with input:", input);

      if (input.action === "search") {
        if (!input.query) return { error: "query is required for search" };

        const data = (await api(
          {
            action: "query",
            list: "search",
            srsearch: input.query,
            srlimit: String(input.maxResults ?? config.defaultMaxResults),
          },
          abortSignal,
        )) as {
          query?: {
            search?: Array<{ title: string; snippet: string; pageid: number }>;
          };
        };

        const results = data.query?.search ?? [];
        return { action: "search", query: input.query, results };
      }

      if (!input.title) return { error: `title is required for ${input.action}` };

      if (input.action === "getSummary") {
        const data = (await api(
          {
            action: "query",
            titles: input.title,
            prop: "extracts",
            exintro: "true",
            explaintext: "true",
            redirects: "1",
          },
          abortSignal,
        )) as {
          query?: {
            pages?: Record<string, { title: string; extract?: string }>;
          };
        };

        const page = Object.values(data.query?.pages ?? {})[0];
        if (!page) return { error: `Article not found: "${input.title}"` };

        return {
          action: "getSummary",
          title: page.title,
          summary: page.extract ?? "",
          url: `https://en.wikipedia.org/wiki/${page.title.replace(/ /g, "_")}`,
        };
      }

      if (input.action === "getContent") {
        const data = (await api(
          {
            action: "query",
            titles: input.title,
            prop: "extracts",
            explaintext: "true",
            redirects: "1",
          },
          abortSignal,
        )) as {
          query?: {
            pages?: Record<string, { title: string; extract?: string }>;
          };
        };

        const page = Object.values(data.query?.pages ?? {})[0];
        if (!page) return { error: `Article not found: "${input.title}"` };

        return {
          action: "getContent",
          title: page.title,
          content: page.extract ?? "",
          url: `https://en.wikipedia.org/wiki/${page.title.replace(/ /g, "_")}`,
        };
      }

      if (input.action === "getLinks") {
        const data = (await api(
          {
            action: "query",
            titles: input.title,
            prop: "links",
            pllimit: String(input.maxResults ?? config.defaultMaxResults),
            plnamespace: "0",
            redirects: "1",
          },
          abortSignal,
        )) as {
          query?: {
            pages?: Record<string, { title: string; links?: Array<{ title: string }> }>;
          };
        };

        const page = Object.values(data.query?.pages ?? {})[0];
        if (!page) return { error: `Article not found: "${input.title}"` };

        return {
          action: "getLinks",
          title: page.title,
          links: (page.links ?? []).map((l) => l.title),
          url: `https://en.wikipedia.org/wiki/${page.title.replace(/ /g, "_")}`,
        };
      }

      if (input.action === "getCategories") {
        const data = (await api(
          {
            action: "query",
            titles: input.title,
            prop: "categories",
            cllimit: String(input.maxResults ?? config.defaultMaxResults),
            redirects: "1",
          },
          abortSignal,
        )) as {
          query?: {
            pages?: Record<string, { title: string; categories?: Array<{ title: string }> }>;
          };
        };

        const page = Object.values(data.query?.pages ?? {})[0];
        if (!page) return { error: `Article not found: "${input.title}"` };

        return {
          action: "getCategories",
          title: page.title,
          categories: (page.categories ?? []).map((c) => c.title.replace(/^Category:/, "")),
          url: `https://en.wikipedia.org/wiki/${page.title.replace(/ /g, "_")}`,
        };
      }

      return { error: `Unknown action: "${input.action}"` };
    },
  });
