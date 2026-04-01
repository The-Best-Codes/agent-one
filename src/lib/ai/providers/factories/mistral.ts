import { createMistral } from "@ai-sdk/mistral";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getMistral(apiKey: string, headers?: Record<string, string>) {
  return createMistral({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
