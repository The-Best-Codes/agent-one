import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch } from "@tauri-apps/plugin-http";

export function getOpenCode(apiKey: string) {
  return createOpenAICompatible({
    name: "opencode",
    apiKey,
    baseURL: "https://opencode.ai/zen/v1",
    fetch: fetch,
  });
}
