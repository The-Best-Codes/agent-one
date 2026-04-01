import { createXai } from "@ai-sdk/xai";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getXai(apiKey: string, headers?: Record<string, string>) {
  return createXai({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
