import { createFireworks } from "@ai-sdk/fireworks";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getFireworks(apiKey: string, headers?: Record<string, string>) {
  return createFireworks({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
