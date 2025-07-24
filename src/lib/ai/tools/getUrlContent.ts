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
    "Fetch and extract content from a URL. Can return content as markdown or raw text.",
  inputSchema: z.object({
    url: z
      .string()
      .describe("The URL to fetch content from (must be a valid URL)"),
    format: z
      .enum(["markdown", "raw"])
      .default("markdown")
      .describe("Format to return content in (markdown recommended)"),
    maxLength: z
      .number()
      .min(1)
      .max(50000)
      .default(1000)
      .describe("Maximum length of content to return"),
    timeoutSeconds: z
      .number()
      .min(1)
      .max(120)
      .default(30)
      .optional()
      .describe("Timeout in seconds"),
  }),
  execute: async (input, { abortSignal }) => {
    const timeoutMs = (input.timeoutSeconds || 30) * 1000 + 5000; // Add 5s buffer

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Frontend timeout")); // TODO: Make sure this actually cancels the fetch on the Rust backend too
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

    const invokePromise = invoke<UrlContentResponse>("get_url_content", {
      url: input.url,
      format: input.format,
      maxLength: input.maxLength,
      timeoutSeconds: input.timeoutSeconds,
    });

    try {
      const result = await Promise.race([invokePromise, timeoutPromise]);

      return {
        success: true,
        url: result.url,
        title: result.title,
        content: result.content,
        format: result.format,
        length: result.length,
        truncated: result.truncated,
        schema: {
          success: "Whether the URL content was successfully fetched",
          url: "The URL that was fetched",
          title: "The page title (if available)",
          content: "The extracted content",
          format: "The format of the returned content",
          length: "The length of the returned content",
          truncated: "Whether the content was truncated due to length limits",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        url: input.url,
        schema: {
          success: "Whether the URL content was successfully fetched",
          error: "Error message if the fetch failed",
          url: "The URL that was attempted to be fetched",
        },
      };
    }
  },
});
