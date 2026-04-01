import { createAnthropic } from "@ai-sdk/anthropic";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getAnthropic(apiKey: string, headers?: Record<string, string>) {
  return createAnthropic({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
