import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const SERVER_URL = "https://www.agent-one.dev/api/openai-compat/v1";

export function getAgentOne(apiKey: string, headers?: Record<string, string>) {
  return createOpenAICompatible({
    name: "agent-one",
    apiKey: apiKey || "not-authenticated",
    baseURL: SERVER_URL,
    fetch: tauriFetch,
    headers,
  });
}
