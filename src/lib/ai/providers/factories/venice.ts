import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { createVenice } from "venice-ai-sdk-provider";

export function getVenice(apiKey: string, headers?: Record<string, string>) {
  return createVenice({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
    baseURL: "https://api.venice.ai/api/v1",
  });
}
