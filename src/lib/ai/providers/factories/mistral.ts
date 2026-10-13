import { createMistral } from "@ai-sdk/mistral";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getMistral(apiKey: string, headers?: Record<string, string>) {
  return createMistral({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
