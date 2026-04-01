import { createDeepInfra } from "@ai-sdk/deepinfra";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getDeepInfra(apiKey: string, headers?: Record<string, string>) {
  return createDeepInfra({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
