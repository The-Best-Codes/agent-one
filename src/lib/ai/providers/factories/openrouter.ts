import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export function getOpenRouter(
  apiKey: string,
  headers?: Record<string, string>,
) {
  return createOpenRouter({
    apiKey: apiKey || "unset",
    headers,
  });
}
