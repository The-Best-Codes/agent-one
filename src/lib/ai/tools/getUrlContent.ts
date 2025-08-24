import { fixUrl } from "@/lib/fix-url";
import { getError } from "@/lib/get-error";
import { getLogger } from "@/lib/logger";
import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

const logger = getLogger(import.meta.url);

interface UrlContentResponse {
  content: string;
  title?: string;
  url: string;
  format: string;
  length: number;
  truncated: boolean;
}

export const GetUrlContentTool = tool({
  name: "getUrlContent",
  description:
    "Fetch and extract content from URLs (up to 5 at once). Can return content as markdown or raw text. Uses webview by default for better JavaScript support.",
  inputSchema: z.object({
    urls: z
      .array(z.string())
      .min(1)
      .max(5)
      .describe(
        "Array of URLs to fetch content from (1-5 URLs, must be valid URLs)",
      ),
    format: z
      .enum(["markdown", "raw"])
      .default("markdown")
      .describe("Format to return content in (markdown recommended)"),
    maxLength: z
      .number()
      .min(1)
      .max(50000)
      .default(1000)
      .describe("Maximum length of content to return per URL"),
    timeoutSeconds: z
      .number()
      .min(1)
      .max(120)
      .default(30)
      .optional()
      .describe("Timeout in seconds per URL"),
    useWebview: z
      .boolean()
      .default(true)
      .optional()
      .describe("Use webview for fetching (better for JS-heavy sites, fallback to HTTP if fails)"),
  }),
  execute: async (input, { abortSignal }) => {
    const timeoutMs = (input.timeoutSeconds || 30) * 1000 + 5000;

    logger.verbose("Executing getUrlContent tool with input:", input);

    let timeoutId: NodeJS.Timeout | undefined = undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        logger.error("Timeout reached:", timeoutMs);
        reject(new Error("Frontend timeout: Operation exceeded allowed time."));
      }, timeoutMs);

      abortSignal?.addEventListener(
        "abort",
        () => {
          if (timeoutId) clearTimeout(timeoutId);
          logger.error("The operation was aborted.");
          const abortError = new Error("The operation was aborted.");
          abortError.name = "AbortError";
          reject(abortError);
        },
        { once: true },
      );
    });

    const fetchPromises = input.urls.map(async (url) => {
      try {
        const fixedUrl = fixUrl(url);
        const result = await invoke<UrlContentResponse>("get_url_content", {
          url: fixedUrl,
          format: input.format,
          maxLength: input.maxLength,
          timeoutSeconds: input.timeoutSeconds,
          useWebview: input.useWebview,
          signal: abortSignal,
        });

        logger.verbose("Fetched URL:", result);

        return {
          success: true,
          url: result.url,
          title: result.title,
          content: result.content,
          format: result.format,
          length: result.length,
          truncated: result.truncated,
        };
      } catch (error) {
        logger.error("Error fetching URL:", error);
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        return {
          success: false,
          error: getError(error as Error),
          url,
        };
      }
    });

    try {
      const results = await Promise.race([
        Promise.all(fetchPromises),
        timeoutPromise,
      ]);

      logger.verbose("Fetched URLs:", results);

      const allUrlsFailed =
        results.length > 0 && results.every((r) => !r.success);

      if (allUrlsFailed) {
        const errorDetails = results
          .filter((r) => r.error)
          .map((r) => `${r.url}: ${r.error}`)
          .join(", ");

        return {
          success: false,
          error: `${results.length > 1 ? `All ${results.length} URLs` : `URL`} failed to fetch. ${errorDetails ? `Details: ${errorDetails}` : "No specific error details available."}`,
          urls: input.urls,
        };
      }

      return {
        success: true,
        results,
        schema: {
          success: "Whether all URL fetches completed",
          results: "Array of results for each URL",
        },
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        throw error;
      }
      logger.error("Error fetching URLs:", error);
      return {
        success: false,
        error: getError(error as Error),
        urls: input.urls,
        schema: {
          success: "Whether all URL fetches completed",
          error: "Error message if the fetch failed",
          urls: "The URLs that were attempted to be fetched",
        },
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },
});
