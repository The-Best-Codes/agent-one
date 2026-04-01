import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getGoogle(apiKey: string, headers?: Record<string, string>) {
  return createGoogleGenerativeAI({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
    headers,
  });
}
