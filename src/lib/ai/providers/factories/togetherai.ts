import { createTogetherAI } from "@ai-sdk/togetherai";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getTogetherAI(apiKey: string, headers?: Record<string, string>) {
  return createTogetherAI({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
