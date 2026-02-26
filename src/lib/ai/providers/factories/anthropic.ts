import { createAnthropic } from "@ai-sdk/anthropic";

export function getAnthropic(apiKey: string, headers?: Record<string, string>) {
  return createAnthropic({
    apiKey: apiKey || "unset",
    headers,
  });
}
