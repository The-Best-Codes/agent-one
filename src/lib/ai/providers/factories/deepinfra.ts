import { createDeepInfra } from "@ai-sdk/deepinfra";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getDeepInfra(apiKey: string, headers?: Record<string, string>) {
  return createDeepInfra({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
