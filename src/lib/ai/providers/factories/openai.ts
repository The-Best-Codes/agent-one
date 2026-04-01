import { createOpenAI } from "@ai-sdk/openai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getOpenAI(apiKey: string, headers?: Record<string, string>) {
  return createOpenAI({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
