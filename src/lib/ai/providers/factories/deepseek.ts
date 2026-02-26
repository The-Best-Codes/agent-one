import { createDeepSeek } from "@ai-sdk/deepseek";

export function getDeepSeek(apiKey: string, headers?: Record<string, string>) {
  return createDeepSeek({
    apiKey: apiKey || "unset",
    headers,
  });
}
