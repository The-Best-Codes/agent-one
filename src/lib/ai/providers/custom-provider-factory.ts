import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

import type { CustomProvider } from "@/lib/jotai/custom-provider-atoms";

export function createCustomProvider(provider: CustomProvider, apiKey: string) {
  return createOpenAICompatible({
    name: provider.id,
    apiKey: apiKey || "not-required",
    baseURL: provider.baseUrl,
    fetch: tauriFetch,
    headers: provider.headers,
  });
}

export interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object?: string;
    created?: number;
    owned_by?: string;
  }>;
}

export async function fetchProviderModels(
  baseUrl: string,
  apiKey?: string,
  headers?: Record<string, string>,
): Promise<OpenAIModelsResponse> {
  const url = baseUrl.endsWith("/") ? `${baseUrl}models` : `${baseUrl}/models`;

  const response = await tauriFetch(url, {
    method: "GET",
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models: ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  if (!json || typeof json !== "object" || !Array.isArray(json.data)) {
    throw new Error("Invalid models response format: missing 'data' array");
  }
  return json as OpenAIModelsResponse;
}
