import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";

export function createOpenAICompatibleFactory(
  name: string,
  baseURL: string,
  defaultHeaders?: Record<string, string>,
  options?: {
    emptyApiKey?: string;
  },
) {
  return (apiKey: string, headers?: Record<string, string>) =>
    createOpenAICompatible({
      name,
      apiKey: apiKey || options?.emptyApiKey || "unset",
      baseURL,
      fetch: providerFetch,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
}
