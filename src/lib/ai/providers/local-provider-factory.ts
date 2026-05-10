import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

import type { LocalProvider } from "@/lib/jotai/local-provider-atoms";

export function createLocalProvider(provider: LocalProvider) {
  return createOpenAICompatible({
    name: provider.id,
    apiKey: "not-required",
    baseURL: provider.baseUrl,
    fetch: tauriFetch,
    headers: provider.headers,
  });
}
