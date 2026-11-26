import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { fetchLmStudioModels } from "@/lib/ai/providers/lm-studio-models";
import { providerFetch } from "@/lib/ai/providers/provider-fetch";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";
import type { CustomProvider } from "@/lib/jotai/custom-provider-atoms";
import { LM_STUDIO_PROVIDER_ID } from "@/lib/jotai/local-provider-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

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
    includeUsage: true,
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

export async function fetchProviderModelMetadata(
  baseUrl: string,
  apiKey?: string,
  headers?: Record<string, string>,
  providerId?: string,
): Promise<ProviderModelMetadata[]> {
  if (providerId === LM_STUDIO_PROVIDER_ID) {
    try {
      return await fetchLmStudioModels(baseUrl, headers);
    } catch (error) {
      logger.warn("LM Studio v1 models API unavailable, falling back to /v1/models", error);
    }
  }

  const response = await fetchProviderModels(baseUrl, apiKey, headers);
  return response.data.map((model) => ({
    id: model.id,
    supportsText: true,
    supportsTools: true,
    supportsImages: false,
    supportsAttachments: false,
  }));
}
