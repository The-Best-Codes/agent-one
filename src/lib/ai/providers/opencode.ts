import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch } from "@tauri-apps/plugin-http";

export function getOpenCode(apiKey: string, headers?: Record<string, string>) {
  return createOpenAICompatible({
    name: "opencode",
    apiKey: apiKey || "unset",
    baseURL: "https://opencode.ai/zen/v1",
    fetch: fetch,
    headers,
  });
}
