import { createTogetherAI } from "@ai-sdk/togetherai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getTogetherAI(apiKey: string, headers?: Record<string, string>) {
  return createTogetherAI({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
