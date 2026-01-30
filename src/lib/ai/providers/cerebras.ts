import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getCerebras(apiKey: string, headers?: Record<string, string>) {
  return createOpenAICompatible({
    name: "cerebras",
    apiKey: apiKey || "unset",
    baseURL: "https://api.cerebras.ai/v1",
    fetch: tauriFetch,
    headers: {
      "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
      ...headers,
    },
  });
}
