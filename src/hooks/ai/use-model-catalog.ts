import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  type ModelsDevData,
  modelsDevData,
  type ModelsDevModel,
} from "@/assets/model-lists/models-dev";
import { apiKeyAtoms } from "@/lib/jotai/api-key-atoms";
import { providerConfigAtoms } from "@/lib/jotai/provider-atoms";
import {
  getEffectiveApiKey,
  hasApiKey,
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/providers/registry";

export interface ModelData {
  id: string;
  name: string;
  provider: string;
  model: LanguageModel;
  supportsToolUse: boolean;
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: undefined,
  maxTokens: undefined,
  topP: undefined,
  topK: undefined,
  frequencyPenalty: undefined,
  presencePenalty: undefined,
  seed: undefined,
};

export const DEFAULT_CHAT_MODEL_ID = "groq-moonshotai/kimi-k2-instruct-0905";

const PREFERRED_MODELS_BY_PROVIDER: Record<ProviderId, string[]> = {
  openrouter: ["openrouter-x-ai/grok-4.1-fast"],
  groq: ["groq-moonshotai/kimi-k2-instruct-0905"],
  google: ["google-gemini-2.5-flash"],
  cerebras: ["cerebras-zai-glm-4.7"],
};

const typedModelsDevData = modelsDevData as unknown as ModelsDevData;

function getProviderModels(providerId: string): ModelsDevModel[] {
  const provider = typedModelsDevData[providerId];
  if (!provider) return [];
  return Object.values(provider.models);
}

function mapModelsDevModels(
  providerId: string,
  providerName: string,
  createModel: (modelId: string) => LanguageModel,
  filter?: (model: ModelsDevModel) => boolean,
): ModelData[] {
  const models = getProviderModels(providerId);
  const filteredModels = filter ? models.filter(filter) : models;

  return filteredModels.map((model) => ({
    id: `${providerId}-${model.id}`,
    name: model.name,
    provider: providerName,
    model: createModel(model.id),
    supportsToolUse: model.tool_call ?? false,
  }));
}

function isChatModel(model: ModelsDevModel): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("text");
}

function isImageModel(model: ModelsDevModel): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("image");
}

export function useModelCatalog() {
  const openrouterKey = useAtomValue(apiKeyAtoms.openrouter.atom);
  const groqKey = useAtomValue(apiKeyAtoms.groq.atom);
  const googleKey = useAtomValue(apiKeyAtoms.google.atom);
  const cerebrasKey = useAtomValue(apiKeyAtoms.cerebras.atom);

  const openrouterConfig = useAtomValue(providerConfigAtoms.openrouter);
  const groqConfig = useAtomValue(providerConfigAtoms.groq);
  const googleConfig = useAtomValue(providerConfigAtoms.google);
  const cerebrasConfig = useAtomValue(providerConfigAtoms.cerebras);

  const apiKeys = useMemo(
    () => ({
      openrouter: openrouterKey,
      groq: groqKey,
      google: googleKey,
      cerebras: cerebrasKey,
    }),
    [openrouterKey, groqKey, googleKey, cerebrasKey],
  );

  const configs = useMemo(
    () => ({
      openrouter: openrouterConfig,
      groq: groqConfig,
      google: googleConfig,
      cerebras: cerebrasConfig,
    }),
    [openrouterConfig, groqConfig, googleConfig, cerebrasConfig],
  );

  const providerHasApiKey = useMemo(
    () =>
      Object.fromEntries(
        PROVIDER_REGISTRY.map((p) => [p.id, hasApiKey(p.id, apiKeys[p.id])]),
      ) as Record<ProviderId, boolean>,
    [apiKeys],
  );

  const providerIsAvailable = useMemo(
    () =>
      Object.fromEntries(
        PROVIDER_REGISTRY.map((p) => [p.id, configs[p.id].enabled]),
      ) as Record<ProviderId, boolean>,
    [configs],
  );

  const providers = useMemo(() => {
    return Object.fromEntries(
      PROVIDER_REGISTRY.map((p) => [
        p.id,
        p.factory(
          getEffectiveApiKey(p.id, apiKeys[p.id]),
          configs[p.id].headers,
        ),
      ]),
    );
  }, [apiKeys, configs]);

  const AVAILABLE_MODELS = useMemo(() => {
    return PROVIDER_REGISTRY.flatMap((p) =>
      mapModelsDevModels(p.id, p.label, providers[p.id].languageModel),
    );
  }, [providers]);

  const AVAILABLE_CHAT_MODELS = useMemo(() => {
    return PROVIDER_REGISTRY.flatMap((p) =>
      mapModelsDevModels(
        p.id,
        p.label,
        providers[p.id].languageModel,
        isChatModel,
      ),
    );
  }, [providers]);

  const AVAILABLE_IMAGE_MODELS = useMemo(() => {
    return PROVIDER_REGISTRY.filter(
      (p) => p.id === "google" || p.id === "openrouter",
    ).flatMap((p) =>
      mapModelsDevModels(
        p.id,
        p.label,
        providers[p.id].languageModel,
        isImageModel,
      ),
    );
  }, [providers]);

  const AVAILABLE_CHAT_MODELS_WITH_API_KEY = useMemo(() => {
    const providerIdByLabel = Object.fromEntries(
      PROVIDER_REGISTRY.map((p) => [p.label, p.id]),
    );

    return AVAILABLE_CHAT_MODELS.filter((model) => {
      const providerId = providerIdByLabel[model.provider];
      return providerId ? providerIsAvailable[providerId as ProviderId] : false;
    });
  }, [AVAILABLE_CHAT_MODELS, providerIsAvailable]);

  const getModelByIdMemoized = useMemo(
    () => (id: string) => AVAILABLE_MODELS.find((model) => model.id === id),
    [AVAILABLE_MODELS],
  );

  const getChatModelByIdMemoized = useMemo(
    () => (id: string) =>
      AVAILABLE_CHAT_MODELS_WITH_API_KEY.find((model) => model.id === id),
    [AVAILABLE_CHAT_MODELS_WITH_API_KEY],
  );

  const getSmartDefaultChatModel = useMemo(() => {
    return (): ModelData | undefined => {
      if (AVAILABLE_CHAT_MODELS_WITH_API_KEY.length === 0) {
        return undefined;
      }

      const providerOrder = PROVIDER_REGISTRY.map((p) => p.id);

      for (const providerId of providerOrder) {
        if (!providerIsAvailable[providerId]) {
          continue;
        }

        const preferredModels = PREFERRED_MODELS_BY_PROVIDER[providerId] || [];
        for (const preferredId of preferredModels) {
          const model = getChatModelByIdMemoized(preferredId);
          if (model) {
            return model;
          }
        }

        const firstModelFromProvider = AVAILABLE_CHAT_MODELS_WITH_API_KEY.find(
          (m) => m.id.startsWith(`${providerId}-`),
        );
        if (firstModelFromProvider) {
          return firstModelFromProvider;
        }
      }

      return AVAILABLE_CHAT_MODELS_WITH_API_KEY[0];
    };
  }, [
    AVAILABLE_CHAT_MODELS_WITH_API_KEY,
    providerIsAvailable,
    getChatModelByIdMemoized,
  ]);

  const hasAvailableModels = AVAILABLE_CHAT_MODELS_WITH_API_KEY.length > 0;

  return {
    AVAILABLE_MODELS,
    AVAILABLE_CHAT_MODELS,
    AVAILABLE_CHAT_MODELS_WITH_API_KEY,
    AVAILABLE_IMAGE_MODELS,
    getModelById: getModelByIdMemoized,
    getChatModelById: getChatModelByIdMemoized,
    getSmartDefaultChatModel,
    hasAvailableModels,
    providerHasApiKey,
    DEFAULT_MODEL_CONFIG,
    DEFAULT_CHAT_MODEL_ID,
  };
}
