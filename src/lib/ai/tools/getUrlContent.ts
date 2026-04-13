import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

import { fixUrl } from "@/lib/fix-url";
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

type SuccessResult = {
  url: string;
  title?: string;
  content: string;
  format: string;
  length: number;
  truncated: boolean;
};

type ErrorResult = {
  error: string;
  url: string;
};

type FetchResult = SuccessResult | ErrorResult;

// TODO: Later, consider streaming the tools results to the UI as they come in:
// https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#preliminary-tool-results

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
    execute: async (input, { abortSignal }) => {
      const timeoutMs = (input.timeoutSeconds || 5) * 1000;

      logger.verbose("Executing getUrlContent tool with input:", input);

      let timeoutId: NodeJS.Timeout | undefined = undefined;

      const partialResults: FetchResult[] = Array.from({
        length: input.urls.length,
      });

      const singleFetch = async (url: string, index: number): Promise<FetchResult> => {
        const fixedUrl = fixUrl(url);
        return invoke<UrlContentResponse>("get_url_content", {
          url: fixedUrl,
          format: input.format,
          maxLength: input.maxLength,
          timeoutSeconds: input.timeoutSeconds,
          useWebview: input.useWebview,
          signal: abortSignal,
        }).then((result) => {
          logger.verbose("Fetched URL:", result);

          const successResult: SuccessResult = {
            url: result.url,
            title: result.title,
            content: result.content,
            format: result.format,
            length: result.length,
            truncated: result.truncated,
          };
          partialResults[index] = successResult;
          return successResult;
        });
      };

      const fetchPromises = input.urls.map((url, index) =>
        singleFetch(url, index).catch((error) => ({
          error: error instanceof Error ? error.message : String(error),
          url,
        })),
      );

      const timeoutPromise = new Promise<"timeout">((resolve) => {
        timeoutId = setTimeout(() => {
          logger.error("Timeout reached:", timeoutMs);
          resolve("timeout");
        }, timeoutMs);
      });

      const raced = await Promise.race([Promise.all(fetchPromises), timeoutPromise]);

      if (raced === "timeout") {
        throw new Error("Operation timed out before the URLs could be fetched.");
      }

      const finalResults: FetchResult[] = input.urls.map(
        (url, index) =>
          partialResults[index] ?? {
            error: "Operation timed out before this URL could be fetched.",
            url,
          },
      );

      logger.verbose("Processed URL results:", finalResults);

      if (timeoutId) clearTimeout(timeoutId);

      if (finalResults.length > 0 && finalResults.every((r) => "error" in r)) {
        const errorDetails = finalResults
          .filter((r): r is ErrorResult => "error" in r && !!r.error)
          .map((r) => `${r.url}: ${r.error}`)
          .join(", ");

        throw new Error(
          `${finalResults.length > 1 ? `All ${finalResults.length} URLs` : `URL`} failed to fetch. ${errorDetails ? `Details: ${errorDetails}` : "No specific error details available."}`,
        );
      }

      return {
        results: finalResults,
      };
    },
  });
