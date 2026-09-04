import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

import { raceWithAbort } from "@/lib/ai/tools/utils/abort";
import { fixUrl } from "@/lib/fix-url";
import i18n from "@/lib/i18n";
import { getLogger } from "@/lib/logger";
import type { GetUrlContentToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

interface UrlContentResponse {
  content: string;
  title?: string;
  url: string;
  format: string;
  length: number;
  truncated: boolean;
}

export interface UrlResult {
  url: string;
  title?: string;
  content?: string;
  format?: string;
  length?: number;
  truncated?: boolean;
  error?: string;
  pending?: boolean;
}

export interface GetUrlContentOutput {
  results: UrlResult[];
}

export const createGetUrlContentTool = (config: GetUrlContentToolConfig) =>
  tool({
    description: `Fetch and extract content from URLs (${config.minUrls} to ${config.maxUrls} at once). Can return content as markdown or raw text.`,
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      urls: z
        .array(z.string())
        .min(config.minUrls)
        .max(config.maxUrls)
        .describe(
          `Array of URLs to fetch content from (${config.minUrls}-${config.maxUrls} URLs, must be valid URLs)`,
        ),
      format: z
        .enum(["markdown", "raw"])
        .default("markdown")
        .describe("Format to return content in (markdown recommended)"),
      maxLength: z
        .number()
        .min(1)
        .max(50000)
        .default(config.defaultMaxLength)
        .describe("Maximum length of content to return per URL"),
      timeoutSeconds: z
        .number()
        .min(1)
        .max(120)
        .default(5)
        .optional()
        .describe("Timeout in seconds per URL"),
      useWebview: z
        .boolean()
        .default(false)
        .optional()
        .describe(
          "Whether to use webview to avoid bot detection, not recommended unless bot detection issues repeatedly occur",
        ),
    }),
    execute: async function* (input, { abortSignal }): AsyncGenerator<GetUrlContentOutput> {
      abortSignal?.throwIfAborted();

      const timeoutMs = (input.timeoutSeconds || 5) * 1000 + 8000;

      logger.verbose("Executing getUrlContent tool with input:", input);

      const results: UrlResult[] = input.urls.map((url) => ({
        url: fixUrl(url),
        pending: true,
      }));

      yield { results: results.map((r) => ({ ...r })) };

      let timeoutId: NodeJS.Timeout | undefined;

      try {
        const fetchPromises = input.urls.map((url, index) =>
          raceWithAbort(
            invoke<UrlContentResponse>("get_url_content", {
              url: fixUrl(url),
              format: input.format,
              maxLength: input.maxLength,
              timeoutSeconds: input.timeoutSeconds,
              useWebview: input.useWebview,
            }),
            abortSignal,
          )
            .then((result): { index: number; result: UrlResult } => {
              logger.verbose("Fetched URL:", {
                url: result.url,
                title: result.title,
                contentLength: result.content?.length,
              });
              return {
                index,
                result: {
                  url: result.url,
                  title: result.title,
                  content: result.content,
                  format: result.format,
                  length: result.length,
                  truncated: result.truncated,
                },
              };
            })
            .catch((error): { index: number; result: UrlResult } => {
              return {
                index,
                result: {
                  error: error instanceof Error ? error.message : String(error),
                  url: fixUrl(url),
                },
              };
            }),
        );

        const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
          timeoutId = setTimeout(() => {
            logger.error("Timeout reached:", timeoutMs);
            resolve({ timeout: true });
          }, timeoutMs);
        });

        const pending = new Set(fetchPromises);

        while (pending.size > 0) {
          const winner = await Promise.race([...pending, timeoutPromise]);

          if ("timeout" in winner) {
            for (let i = 0; i < results.length; i++) {
              if (results[i].pending) {
                results[i] = {
                  url: results[i].url,
                  error: i18n.t("tools.urlFetchTimeout"),
                };
              }
            }
            break;
          }

          pending.delete(fetchPromises[winner.index]);
          results[winner.index] = winner.result;
          yield { results: results.map((r) => ({ ...r })) };
        }

        yield { results: results.map((r) => ({ ...r })) };

        abortSignal?.throwIfAborted();

        const hasAnySuccess = results.some((r) => !r.error && !r.pending);
        if (!hasAnySuccess) {
          const errorDetails = results
            .filter((r) => r.error)
            .map((r) => `${r.url}: ${r.error}`)
            .join(", ");

          throw new Error(
            `${results.length > 1 ? `All ${results.length} URLs` : `URL`} failed to fetch. ${errorDetails ? `Details: ${errorDetails}` : "No specific error details available."}`,
          );
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    },
  });
