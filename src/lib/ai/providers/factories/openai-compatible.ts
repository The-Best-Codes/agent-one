import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function createOpenAICompatibleFactory(
  name: string,
  baseURL: string,
  defaultHeaders?: Record<string, string>,
  options?: {
    emptyApiKey?: string;
  },
) {
  return (apiKey: string, headers?: Record<string, string>) =>
    createOpenAICompatible({
      name,
      apiKey: apiKey || options?.emptyApiKey || "unset",
      baseURL,
      fetch: tauriFetch,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
}
