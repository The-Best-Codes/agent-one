import { createPerplexity } from "@ai-sdk/perplexity";

export function getPerplexity(apiKey: string, headers?: Record<string, string>) {
  return createPerplexity({
    apiKey: apiKey || "unset",
    headers,
  });
}
