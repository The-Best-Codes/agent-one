import { invoke } from "@tauri-apps/api/core";
import { tool } from "ai";
import { z } from "zod";

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
      .default(30)
      .optional()
      .describe("Timeout in seconds per URL"),
  }),
  execute: async (input, { abortSignal }) => {
    const timeoutMs = (input.timeoutSeconds || 30) * 1000 + 5000;

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Frontend timeout"));
      }, timeoutMs);

      abortSignal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timeoutId);
          reject(new Error("Operation aborted"));
        },
        { once: true },
      );
    });

    const fetchPromises = input.urls.map(async (url) => {
      try {
        const result = await invoke<UrlContentResponse>("get_url_content", {
          url,
          format: input.format,
          maxLength: input.maxLength,
          timeoutSeconds: input.timeoutSeconds,
        });
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
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          url,
        };
      }
    });

    try {
      const results = await Promise.race([
        Promise.all(fetchPromises),
        timeoutPromise,
      ]);

      return {
        success: true,
        results,
        schema: {
          success: "Whether all URL fetches completed",
          results: "Array of results for each URL",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        urls: input.urls,
        schema: {
          success: "Whether all URL fetches completed",
          error: "Error message if the fetch failed",
          urls: "The URLs that were attempted to be fetched",
        },
      };
    }
  },
});
