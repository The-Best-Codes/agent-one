import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";
import type { LocalProvider } from "@/lib/jotai/local-provider-atoms";

export function createLocalProvider(provider: LocalProvider) {
  return createOpenAICompatible({
    name: provider.id,
    apiKey: "not-required",
    baseURL: provider.baseUrl,
    fetch: providerFetch,
    headers: provider.headers,
  });
}
