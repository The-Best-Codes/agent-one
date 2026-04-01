import { createDeepSeek } from "@ai-sdk/deepseek";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getDeepSeek(apiKey: string, headers?: Record<string, string>) {
  return createDeepSeek({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
