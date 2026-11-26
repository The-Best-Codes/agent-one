import { providerFetch } from "@/lib/ai/providers/provider-fetch";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";

interface LmStudioModel {
  type?: string;
  key?: string;
  display_name?: string | null;
  max_context_length?: number | null;
  loaded_instances?: Array<{ config?: { context_length?: number | null } }>;
  capabilities?: {
    vision?: boolean;
    trained_for_tool_use?: boolean;
    reasoning?: unknown;
  };
  reasoning?: unknown;
}

function buildLmStudioModelsUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, "").replace(/\/v1$/, "");
  url.pathname = `${basePath}/api/v1/models`;
  url.search = "";
  return url.toString();
}

function mapLmStudioModel(model: LmStudioModel & { key: string }): ProviderModelMetadata {
  const loadedContextLength = model.loaded_instances?.[0]?.config?.context_length;

  return {
    id: model.key,
    name: model.display_name?.trim() || undefined,
    supportsText: true,
    supportsTools: model.capabilities?.trained_for_tool_use ?? true,
    supportsImages: false,
    supportsImageInput: model.capabilities?.vision ?? false,
    supportsAttachments: false,
    supportsReasoning: Boolean(model.capabilities?.reasoning ?? model.reasoning),
    contextWindow: loadedContextLength ?? model.max_context_length ?? undefined,
  };
}

export async function fetchLmStudioModels(
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<ProviderModelMetadata[]> {
  const response = await providerFetch(buildLmStudioModelsUrl(baseUrl), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (!json || typeof json !== "object" || !Array.isArray(json.models)) {
    throw new Error("Invalid models response format: missing 'models' array");
  }

  return (json.models as LmStudioModel[])
    .filter(
      (model): model is LmStudioModel & { key: string } =>
        model?.type === "llm" && typeof model.key === "string" && model.key.length > 0,
    )
    .map(mapLmStudioModel);
}
