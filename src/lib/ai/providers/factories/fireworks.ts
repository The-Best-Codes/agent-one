import { createFireworks } from "@ai-sdk/fireworks";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getFireworks(apiKey: string, headers?: Record<string, string>) {
  return createFireworks({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
