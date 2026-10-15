import { createCohere } from "@ai-sdk/cohere";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getCohere(apiKey: string, headers?: Record<string, string>) {
  return createCohere({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
