import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const OPENROUTER_ATTRIBUTION_HEADERS = {
  "HTTP-Referer": "https://www.agent-one.dev",
  "X-OpenRouter-Title": "AgentOne",
  "X-OpenRouter-Categories": "general-chat",
} as const;

export function getOpenRouter(apiKey: string, headers?: Record<string, string>) {
  return createOpenRouter({
    apiKey: apiKey || "unset",
    headers: {
      ...OPENROUTER_ATTRIBUTION_HEADERS,
      ...headers,
    },
  });
}
