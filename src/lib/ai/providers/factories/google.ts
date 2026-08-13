import { createGoogle } from "@ai-sdk/google";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getGoogle(apiKey: string, headers?: Record<string, string>) {
  return createGoogle({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
