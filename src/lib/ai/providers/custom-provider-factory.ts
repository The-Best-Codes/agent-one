import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { providerFetch } from "@/lib/ai/providers/provider-fetch";
import type { CustomProvider } from "@/lib/jotai/custom-provider-atoms";

export interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object?: string;
    created?: number;
    owned_by?: string;
  }>;
}

function buildModelsUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? `${baseUrl}models` : `${baseUrl}/models`;
}

function buildRequestHeaders(apiKey?: string, headers?: Record<string, string>) {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...headers,
  };
}

export function createCustomProvider(provider: CustomProvider, apiKey: string) {
  return createOpenAICompatible({
    name: provider.id,
    apiKey: apiKey || "not-required",
    baseURL: provider.baseUrl,
    fetch: providerFetch,
    headers: provider.headers,
  });
}

export async function fetchProviderModels(
  baseUrl: string,
  apiKey?: string,
  headers?: Record<string, string>,
): Promise<OpenAIModelsResponse> {
  const response = await providerFetch(buildModelsUrl(baseUrl), {
    method: "GET",
    headers: buildRequestHeaders(apiKey, headers),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json || typeof json !== "object") {
    throw new Error("Invalid models response format: expected an object");
  }

  // Ollama returns `data: null` when no models are installed
  if (json.data === null) {
    return { ...json, data: [] } as OpenAIModelsResponse;
  }

  if (!Array.isArray(json.data)) {
    throw new Error("Invalid models response format: missing 'data' array");
  }

  return json as OpenAIModelsResponse;
}
