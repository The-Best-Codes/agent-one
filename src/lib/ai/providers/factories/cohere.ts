import { createCohere } from "@ai-sdk/cohere";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getCohere(apiKey: string, headers?: Record<string, string>) {
  return createCohere({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
