import { createXai } from "@ai-sdk/xai";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getXai(apiKey: string, headers?: Record<string, string>) {
  return createXai({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
