import { createGroq } from "@ai-sdk/groq";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function getGroq(apiKey: string, headers?: Record<string, string>) {
  return createGroq({
    apiKey: apiKey || "unset",
    fetch: providerFetch,
    headers,
  });
}
