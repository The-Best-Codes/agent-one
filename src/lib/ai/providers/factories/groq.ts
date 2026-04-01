import { createGroq } from "@ai-sdk/groq";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getGroq(apiKey: string, headers?: Record<string, string>) {
  return createGroq({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
