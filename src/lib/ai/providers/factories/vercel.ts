import { createGateway } from "@ai-sdk/gateway";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getVercel(apiKey: string, headers?: Record<string, string>) {
  return createGateway({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
