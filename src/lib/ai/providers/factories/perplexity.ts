import { createPerplexity } from "@ai-sdk/perplexity";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getPerplexity(apiKey: string, headers?: Record<string, string>) {
  return createPerplexity({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
