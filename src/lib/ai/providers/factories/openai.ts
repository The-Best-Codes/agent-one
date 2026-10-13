import { createOpenAI } from "@ai-sdk/openai";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getOpenAI(apiKey: string, headers?: Record<string, string>) {
  return createOpenAI({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
