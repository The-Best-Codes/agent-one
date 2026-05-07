import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { modelDirectoryData, type ModelRecord } from "@/assets/model-lists/model-directory";
import { createCustomProvider } from "@/lib/ai/providers/custom-provider-factory";
import {
  getEffectiveApiKey,
  hasApiKey,
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/ai/providers/registry";
import { allApiKeysAtom } from "@/lib/jotai/api-key-atoms";
import { hideAgentOneModelsAtom } from "@/lib/jotai/atoms";
import { customProviderApiKeysAtom } from "@/lib/jotai/custom-provider-api-key-atoms";
import { type CustomProvider, customProvidersAtom } from "@/lib/jotai/custom-provider-atoms";
import { allProviderConfigsAtom } from "@/lib/jotai/provider-atoms";

export interface ModelData {
  id: string;
  name: string;
  provider: string;
  model: LanguageModel;
  supportsToolUse: boolean;
  contextWindow?: number;
}

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: undefined,
  maxTokens: undefined,
  maxSteps: undefined,
  topP: undefined,
  topK: undefined,
  frequencyPenalty: undefined,
  presencePenalty: undefined,
  seed: undefined,
};

export const DEFAULT_CHAT_MODEL_ID = "groq-moonshotai/kimi-k2-instruct-0905";

const PREFERRED_MODELS_BY_PROVIDER: Partial<Record<ProviderId, string[]>> = {
  "agent-one": ["agent-one-auto"],
  openrouter: ["openrouter-x-ai/grok-4.1-fast"],
  groq: ["groq-moonshotai/kimi-k2-instruct-0905"],
  google: ["google-gemini-2.5-flash"],
  cerebras: ["cerebras-zai-glm-4.7"],
  openai: ["openai-gpt-5.2-chat-latest"],
  anthropic: ["anthropic-claude-sonnet-4-6"],
  mistral: ["mistral-devstral-medium-2507"],
  deepseek: ["deepseek-deepseek-chat"],
  xai: ["xai-grok-4-1-fast"],
  cohere: ["cohere-command-a-reasoning-08-2025"],
  deepinfra: ["deepinfra-moonshotai/Kimi-K2.5"],
  perplexity: ["perplexity-sonar-deep-research"],
  togetherai: ["togetherai-moonshotai/Kimi-K2.5"],
  "fireworks-ai": ["fireworks-ai-accounts/fireworks/models/kimi-k2p5"],
};

function getProviderModels(providerId: string): ModelRecord[] {
  const provider = modelDirectoryData[providerId];
  if (!provider) return [];
  return Object.values(provider.models);
}

function mapDirectoryModels(
  providerId: string,
  providerName: string,
  createModel: (modelId: string) => LanguageModel,
  filter?: (model: ModelRecord) => boolean,
): ModelData[] {
  const models = getProviderModels(providerId);
  const filteredModels = filter ? models.filter(filter) : models;

  return filteredModels.map((model) => ({
    id: `${providerId}-${model.id}`,
    name: model.name ?? model.id,
    provider: providerName,
    model: createModel(model.id),
    supportsToolUse: model.features?.tool_call ?? false,
    contextWindow: model.limit?.context,
  }));
}

function mapCustomProviderModels(provider: CustomProvider, apiKey: string): ModelData[] {
  const instance = createCustomProvider(provider, apiKey);

  return provider.models.map((model) => ({
    id: `custom-${provider.id}-${model.id}`,
    name: model.name || model.id,
    provider: provider.name,
    model: instance.languageModel(model.id),
    supportsToolUse: model.supportsTools,
    // TODO: Support context window and pricing definitions for custom provider's models
    // When implementing the above, be sure to review ALL model-related files.
  }));
}

function isChatModel(model: ModelRecord): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("text");
}

function isImageModel(model: ModelRecord): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("image");
}

export function useModelCatalog() {
  const hideAgentOneModels = useAtomValue(hideAgentOneModelsAtom);
  const apiKeys = useAtomValue(allApiKeysAtom);
  const configs = useAtomValue(allProviderConfigsAtom);

  const customProviders = useAtomValue(customProvidersAtom);
  const customProviderApiKeys = useAtomValue(customProviderApiKeysAtom);

  const providerHasApiKey = useMemo(
    () =>
      Object.fromEntries(
        PROVIDER_REGISTRY.map((p) => [p.id, hasApiKey(p.id, apiKeys[p.id])]),
      ) as Record<ProviderId, boolean>,
    [apiKeys],
  );

  const providerIsAvailable = useMemo(
    () =>
      Object.fromEntries(PROVIDER_REGISTRY.map((p) => [p.id, configs[p.id].enabled])) as Record<
        ProviderId,
        boolean
      >,
    [configs],
  );

  const providers = useMemo(() => {
    return Object.fromEntries(
      PROVIDER_REGISTRY.map((p) => [
        p.id,
        p.factory(getEffectiveApiKey(p.id, apiKeys[p.id]), configs[p.id].headers),
      ]),
    );
  }, [apiKeys, configs]);

  const AVAILABLE_MODELS = useMemo(() => {
    const builtInModels = PROVIDER_REGISTRY.flatMap((p) =>
      mapDirectoryModels(p.id, p.label, providers[p.id].languageModel),
    );

    const customModels = customProviders
      .filter((p) => p.enabled)
      .flatMap((p) => mapCustomProviderModels(p, customProviderApiKeys[p.id] ?? ""));

    return [...builtInModels, ...customModels];
  }, [providers, customProviders, customProviderApiKeys]);

  const AVAILABLE_CHAT_MODELS = useMemo(() => {
    const builtInModels = PROVIDER_REGISTRY.flatMap((p) =>
      mapDirectoryModels(p.id, p.label, providers[p.id].languageModel, isChatModel),
    );

    const customModels = customProviders
      .filter((p) => p.enabled)
      .flatMap((p) => mapCustomProviderModels(p, customProviderApiKeys[p.id] ?? ""));

    return [...builtInModels, ...customModels];
  }, [providers, customProviders, customProviderApiKeys]);

  const AVAILABLE_IMAGE_MODELS = useMemo(() => {
    const builtInModels = PROVIDER_REGISTRY.filter(
      (p) => p.id === "google" || p.id === "openrouter",
    ).flatMap((p) =>
      mapDirectoryModels(p.id, p.label, providers[p.id].languageModel, isImageModel),
    );

    const customModels = customProviders
      .filter((p) => p.enabled)
      .flatMap((p) => {
        const instance = createCustomProvider(p, customProviderApiKeys[p.id] ?? "");
        return p.models
          .filter((m) => m.supportsImages)
          .map((m) => ({
            id: `custom-${p.id}-${m.id}`,
            name: m.name || m.id,
            provider: p.name,
            model: instance.languageModel(m.id),
            supportsToolUse: m.supportsTools,
          }));
      });

    return [...builtInModels, ...customModels];
  }, [providers, customProviders, customProviderApiKeys]);

  const AVAILABLE_ENABLED_CHAT_MODELS = useMemo(() => {
    const providerIdByLabel = Object.fromEntries(PROVIDER_REGISTRY.map((p) => [p.label, p.id]));

    return AVAILABLE_CHAT_MODELS.filter((model) => {
      if (model.id.startsWith("custom-")) {
        return true;
      }

      if (hideAgentOneModels && model.id.startsWith("agent-one-")) {
        return false;
      }

      const providerId = providerIdByLabel[model.provider];
      return providerId ? providerIsAvailable[providerId as ProviderId] : false;
    });
  }, [AVAILABLE_CHAT_MODELS, providerIsAvailable, hideAgentOneModels]);

  const getModelByIdMemoized = useMemo(
    () => (id: string) => AVAILABLE_MODELS.find((model) => model.id === id),
    [AVAILABLE_MODELS],
  );

  const getChatModelByIdMemoized = useMemo(
    () => (id: string) => AVAILABLE_ENABLED_CHAT_MODELS.find((model) => model.id === id),
    [AVAILABLE_ENABLED_CHAT_MODELS],
  );

  const getSmartDefaultChatModel = useMemo(() => {
    return (): ModelData | undefined => {
      if (AVAILABLE_ENABLED_CHAT_MODELS.length === 0) {
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

        const firstModelFromProvider = AVAILABLE_ENABLED_CHAT_MODELS.find((m) =>
          m.id.startsWith(`${providerId}-`),
        );
        if (firstModelFromProvider) {
          return firstModelFromProvider;
        }
      }

      return AVAILABLE_ENABLED_CHAT_MODELS[0];
    };
  }, [AVAILABLE_ENABLED_CHAT_MODELS, providerIsAvailable, getChatModelByIdMemoized]);

  const hasAvailableModels = AVAILABLE_ENABLED_CHAT_MODELS.length > 0;

  return {
    AVAILABLE_MODELS,
    AVAILABLE_CHAT_MODELS,
    AVAILABLE_ENABLED_CHAT_MODELS,
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
