import { createPerplexity } from "@ai-sdk/perplexity";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getPerplexity(apiKey: string, headers?: Record<string, string>) {
  return createPerplexity({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
