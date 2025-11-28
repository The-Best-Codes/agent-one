import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function createOpenRouterProvider(apiKey?: string) {
  return createOpenRouter({
    apiKey: apiKey || import.meta.env.AGENT_ONE_OPENROUTER_API_KEY,
  });
}
