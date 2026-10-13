import { createDeepSeek } from "@ai-sdk/deepseek";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getDeepSeek(apiKey: string, headers?: Record<string, string>) {
  return createDeepSeek({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
