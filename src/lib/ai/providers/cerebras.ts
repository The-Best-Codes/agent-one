import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getCerebras(apiKey: string, headers?: Record<string, string>) {
  return createOpenAICompatible({
    name: "cerebras",
    apiKey: apiKey || "unset",
    baseURL: "https://api.cerebras.ai/v1",
    headers: {
      "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
      ...headers,
    },
  });
}
