import { createGoogle } from "@ai-sdk/google";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getGoogle(apiKey: string, headers?: Record<string, string>) {
  return createGoogle({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
