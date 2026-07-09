import type { ModelDirectoryData, ModelRecord } from "@/lib/ai/models/model-directory";

export interface ProviderModelMetadata {
  id: string;
  name?: string;
  supportsText: boolean;
  supportsTools: boolean;
  supportsImages: boolean;
  contextWindow?: number;
  maxOutputTokens?: number;
}

export function getProviderModelName(model: ProviderModelMetadata) {
  return model.name?.trim() || model.id;
}

export function mapDirectoryModelToMetadata(model: ModelRecord): ProviderModelMetadata {
  const outputModalities = model.modalities?.output ?? [];

  return {
    id: model.id,
    name: model.name,
    supportsText: outputModalities.includes("text"),
    supportsTools: model.features?.tool_call ?? false,
    supportsImages: outputModalities.includes("image"),
    contextWindow: model.limit?.context,
    maxOutputTokens: model.limit?.output,
  };
}

export function normalizeProviderModelMetadata(
  model: Pick<ProviderModelMetadata, "id"> & Partial<ProviderModelMetadata>,
): ProviderModelMetadata {
  return {
    id: model.id,
    name: model.name,
    supportsText: model.supportsText ?? true,
    supportsTools: model.supportsTools ?? false,
    supportsImages: model.supportsImages ?? false,
    contextWindow: model.contextWindow,
    maxOutputTokens: model.maxOutputTokens,
  };
}

export function getBuiltInProviderModels(
  providerId: string,
  modelDirectoryData: ModelDirectoryData,
) {
  return Object.values(modelDirectoryData[providerId]?.models ?? {}).map(
    mapDirectoryModelToMetadata,
  );
}
