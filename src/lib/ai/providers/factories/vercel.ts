import { createGateway } from "@ai-sdk/gateway";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getVercel(apiKey: string, headers?: Record<string, string>) {
  return createGateway({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
