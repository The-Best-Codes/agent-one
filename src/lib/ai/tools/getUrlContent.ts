import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

import { getError } from "@/lib/error/get-error";
import { fixUrl } from "@/lib/fix-url";
import { getLogger } from "@/lib/logger";

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
  success: true;
  url: string;
  title?: string;
  content: string;
  format: string;
  length: number;
  truncated: boolean;
};

type ErrorResult = {
  success: false;
  error: string;
  url: string;
};

type FetchResult = SuccessResult | ErrorResult;

export const GetUrlContentTool = tool({
  description:
    "Fetch and extract content from URLs (up to 5 at once). Can return content as markdown or raw text.",
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

    const partialResults: FetchResult[] = new Array(input.urls.length);

    const singleFetch = async (
      url: string,
      index: number,
    ): Promise<FetchResult> => {
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

        const successResult: SuccessResult = {
          success: true,
          url: result.url,
          title: result.title,
          content: result.content,
          format: result.format,
          length: result.length,
          truncated: result.truncated,
        };
        partialResults[index] = successResult;
        return successResult;
      } catch (error) {
        logger.error("Error fetching URL:", url, error);
        if ((error as Error).name === "AbortError") {
          throw error;
        }
        const errorResult: ErrorResult = {
          success: false,
          error: getError(error as Error),
          url,
        };
        partialResults[index] = errorResult;
        return errorResult;
      }
    };

    try {
      const fetchPromises = input.urls.map((url, index) =>
        singleFetch(url, index),
      );

      const timeoutPromise = new Promise<"timeout">((resolve) => {
        timeoutId = setTimeout(() => {
          logger.error("Timeout reached:", timeoutMs);
          resolve("timeout");
        }, timeoutMs);
      });

      // Wait for either all fetches to complete or the timeout to be hit
      await Promise.race([Promise.all(fetchPromises), timeoutPromise]);

      // After the race, construct the final results list.
      // If a result exists in partialResults, use it. Otherwise, create a timeout error.
      const finalResults: FetchResult[] = input.urls.map((url, index) => {
        if (partialResults[index]) {
          return partialResults[index];
        }
        return {
          success: false,
          error: "Operation timed out before this URL could be fetched.",
          url: url,
        };
      });

      logger.verbose("Processed URL results:", finalResults);

      const allUrlsFailed =
        finalResults.length > 0 && finalResults.every((r) => !r.success);

      if (allUrlsFailed) {
        const errorDetails = finalResults
          .filter((r): r is ErrorResult => !r.success && !!r.error)
          .map((r) => `${r.url}: ${r.error}`)
          .join(", ");

        return {
          success: false,
          error: `${finalResults.length > 1 ? `All ${finalResults.length} URLs` : `URL`} failed to fetch. ${errorDetails ? `Details: ${errorDetails}` : "No specific error details available."}`,
          urls: input.urls,
        };
      }

      return {
        success: true,
        results: finalResults,
        schema: {
          success:
            "Indicates if the operation as a whole is considered successful (at least one URL succeeded)",
          results:
            "Array of results for each URL, including success, error, or timeout status",
        },
      };
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        logger.error("The operation was aborted.");
        throw error;
      }
      logger.error("An unexpected error occurred while fetching URLs:", error);
      return {
        success: false,
        error: `An unexpected error occurred: ${getError(error as Error)}`,
        urls: input.urls,
        schema: {
          success: "Indicates the operation failed unexpectedly",
          error: "Error message describing the failure",
          urls: "The URLs that were attempted to be fetched",
        },
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  },
});
