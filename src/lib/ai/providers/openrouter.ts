import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getOpenRouter(apiKey: string) {
  return createOpenRouter({
    apiKey,
  });
}
