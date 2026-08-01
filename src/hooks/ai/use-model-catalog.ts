import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { atom } from "jotai";
import { useMemo } from "react";

import {
  getBillingUsageSummary,
  hasAgentOneCreditsAvailable,
} from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  modelDirectoryDataAtom,
  type ModelDirectoryData,
  type ModelRecord,
} from "@/lib/ai/models/model-directory";
import { createCustomProvider } from "@/lib/ai/providers/custom-provider-factory";
import { createLocalProvider } from "@/lib/ai/providers/local-provider-factory";
import {
  mapDirectoryModelToMetadata,
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";
import {
  getEffectiveApiKey,
  hasApiKey,
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/ai/providers/registry";
import { apiKeyAtomFamily } from "@/lib/jotai/api-key-atoms";
import { hideAgentOneModelsAtom } from "@/lib/jotai/atoms";
import { customProviderApiKeysAtom } from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  type CustomProvider,
  normalizedCustomProvidersAtom,
} from "@/lib/jotai/custom-provider-atoms";
import { type LocalProvider, normalizedLocalProvidersAtom } from "@/lib/jotai/local-provider-atoms";
import {
  providerEnabledAtomFamily,
  providerHeadersAtomFamily,
  providerModelsAtomFamily,
} from "@/lib/jotai/provider-atoms";

export interface ModelData {
  id: string;
  name: string;
  provider: string;
  providerId: string;
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
  yoloMode?: boolean;
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
  yoloMode: false,
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

function getProviderModels(
  modelDirectoryData: ModelDirectoryData,
  providerId: string,
): ModelRecord[] {
  const provider = modelDirectoryData[providerId];
  if (!provider) {
    return [];
  }

  return Object.values(provider.models);
}

function toModelRecord(model: ProviderModelMetadata): ModelRecord {
  return {
    id: model.id,
    name: model.name,
    features: {
      tool_call: model.supportsTools,
    },
    limit: {
      context: model.contextWindow,
      output: model.maxOutputTokens,
    },
    modalities: {
      output: [
        ...(model.supportsText ? (["text"] as const) : []),
        ...(model.supportsImages ? (["image"] as const) : []),
      ],
    },
  };
}

function mapDirectoryModels(
  modelDirectoryData: ModelDirectoryData,
  providerId: string,
  providerName: string,
  createModel: (modelId: string) => LanguageModel,
  overrides: ProviderModelMetadata[],
  filter?: (model: ModelRecord) => boolean,
): ModelData[] {
  const modelMap = new Map(
    getProviderModels(modelDirectoryData, providerId)
      .map(mapDirectoryModelToMetadata)
      .map((model) => [model.id, model] as const),
  );

  for (const override of overrides) {
    modelMap.set(override.id, normalizeProviderModelMetadata(override));
  }

  const models = Array.from(modelMap.values());
  const filteredModels = filter ? models.filter((model) => filter(toModelRecord(model))) : models;

  return filteredModels.map((model) => ({
    id: `${providerId}-${model.id}`,
    name: model.name ?? model.id,
    provider: providerName,
    providerId,
    model: createModel(model.id),
    supportsToolUse: model.supportsTools,
    contextWindow: model.contextWindow,
  }));
}

function mapCustomProviderModels(
  provider: CustomProvider,
  apiKey: string,
  filter?: (model: ProviderModelMetadata) => boolean,
): ModelData[] {
  const instance = createCustomProvider(provider, apiKey);

  return provider.models
    .map(normalizeProviderModelMetadata)
    .filter((model) => (filter ? filter(model) : true))
    .map((model) => ({
      id: `custom-${provider.id}-${model.id}`,
      name: model.name || model.id,
      provider: provider.name,
      providerId: provider.id,
      model: instance.languageModel(model.id),
      supportsToolUse: model.supportsTools,
      contextWindow: model.contextWindow,
    }));
}

function mapLocalProviderModels(
  provider: LocalProvider,
  filter?: (model: ProviderModelMetadata) => boolean,
): ModelData[] {
  const instance = createLocalProvider(provider);

  return provider.models
    .map(normalizeProviderModelMetadata)
    .filter((model) => (filter ? filter(model) : true))
    .map((model) => ({
      id: `local-${provider.id}-${model.id}`,
      name: model.name || model.id,
      provider: provider.name,
      providerId: provider.id,
      model: instance.languageModel(model.id),
      supportsToolUse: model.supportsTools,
      contextWindow: model.contextWindow,
    }));
}

function isChatModel(model: ModelRecord) {
  return (model.modalities?.output ?? []).includes("text");
}

function isImageModel(model: ModelRecord) {
  return (model.modalities?.output ?? []).includes("image");
}

const providerHasApiKeyAtom = atom((get) => {
  return Object.fromEntries(
    PROVIDER_REGISTRY.map((provider) => [
      provider.id,
      hasApiKey(provider.id, get(apiKeyAtomFamily(provider.id))),
    ]),
  ) as Record<ProviderId, boolean>;
});

const providerIsAvailableAtom = atom((get) => {
  return Object.fromEntries(
    PROVIDER_REGISTRY.map((provider) => [provider.id, get(providerEnabledAtomFamily(provider.id))]),
  ) as Record<ProviderId, boolean>;
});

const providerInstancesAtom = atom((get) => {
  return Object.fromEntries(
    PROVIDER_REGISTRY.map((provider) => [
      provider.id,
      provider.factory(
        getEffectiveApiKey(provider.id, get(apiKeyAtomFamily(provider.id))),
        get(providerHeadersAtomFamily(provider.id)),
      ),
    ]),
  ) as Record<ProviderId, ReturnType<(typeof PROVIDER_REGISTRY)[number]["factory"]>>;
});

const availableModelsAtom = atom((get) => {
  const localProviders = get(normalizedLocalProvidersAtom);
  const customProviders = get(normalizedCustomProvidersAtom);
  const customProviderApiKeys = get(customProviderApiKeysAtom);
  const modelDirectoryData = get(modelDirectoryDataAtom);
  const providers = get(providerInstancesAtom);

  const builtInModels = PROVIDER_REGISTRY.flatMap((provider) =>
    mapDirectoryModels(
      modelDirectoryData,
      provider.id,
      provider.label,
      providers[provider.id].languageModel,
      get(providerModelsAtomFamily(provider.id)),
    ),
  );

  const customModels = customProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) =>
      mapCustomProviderModels(provider, customProviderApiKeys[provider.id] ?? ""),
    );

  const localModels = localProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) => mapLocalProviderModels(provider));

  return [...builtInModels, ...localModels, ...customModels];
});

const availableChatModelsAtom = atom((get) => {
  const localProviders = get(normalizedLocalProvidersAtom);
  const customProviders = get(normalizedCustomProvidersAtom);
  const customProviderApiKeys = get(customProviderApiKeysAtom);
  const modelDirectoryData = get(modelDirectoryDataAtom);
  const providers = get(providerInstancesAtom);

  const builtInModels = PROVIDER_REGISTRY.flatMap((provider) =>
    mapDirectoryModels(
      modelDirectoryData,
      provider.id,
      provider.label,
      providers[provider.id].languageModel,
      get(providerModelsAtomFamily(provider.id)),
      isChatModel,
    ),
  );

  const customModels = customProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) =>
      mapCustomProviderModels(
        provider,
        customProviderApiKeys[provider.id] ?? "",
        (model) => model.supportsText,
      ),
    );

  const localModels = localProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) => mapLocalProviderModels(provider, (model) => model.supportsText));

  return [...builtInModels, ...localModels, ...customModels];
});

const availableImageModelsAtom = atom((get) => {
  const localProviders = get(normalizedLocalProvidersAtom);
  const customProviders = get(normalizedCustomProvidersAtom);
  const customProviderApiKeys = get(customProviderApiKeysAtom);
  const modelDirectoryData = get(modelDirectoryDataAtom);
  const providers = get(providerInstancesAtom);

  const builtInModels = PROVIDER_REGISTRY.filter(
    (provider) => provider.id === "google" || provider.id === "openrouter",
  ).flatMap((provider) =>
    mapDirectoryModels(
      modelDirectoryData,
      provider.id,
      provider.label,
      providers[provider.id].languageModel,
      get(providerModelsAtomFamily(provider.id)),
      isImageModel,
    ),
  );

  const customModels = customProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) => {
      const instance = createCustomProvider(provider, customProviderApiKeys[provider.id] ?? "");

      return provider.models
        .map(normalizeProviderModelMetadata)
        .filter((model) => model.supportsImages)
        .map((model) => ({
          id: `custom-${provider.id}-${model.id}`,
          name: model.name || model.id,
          provider: provider.name,
          model: instance.languageModel(model.id),
          supportsToolUse: model.supportsTools,
        }));
    });

  const localModels = localProviders
    .filter((provider) => provider.enabled)
    .flatMap((provider) => mapLocalProviderModels(provider, (model) => model.supportsImages));

  return [...builtInModels, ...localModels, ...customModels];
});

const availableEnabledChatModelsAtom = atom((get) => {
  const hideAgentOneModels = get(hideAgentOneModelsAtom);
  const availableChatModels = get(availableChatModelsAtom);
  const providerIsAvailable = get(providerIsAvailableAtom);
  const providerIdByLabel = Object.fromEntries(
    PROVIDER_REGISTRY.map((provider) => [provider.label, provider.id]),
  ) as Record<string, ProviderId>;

  return availableChatModels.filter((model) => {
    if (model.id.startsWith("custom-") || model.id.startsWith("local-")) {
      return true;
    }

    if (hideAgentOneModels && model.id.startsWith("agent-one-")) {
      return false;
    }

    const providerId = providerIdByLabel[model.provider];
    return providerId ? providerIsAvailable[providerId] : false;
  });
});

export function useModelCatalog() {
  const AVAILABLE_MODELS = useAtomValue(availableModelsAtom);
  const AVAILABLE_CHAT_MODELS = useAtomValue(availableChatModelsAtom);
  const baseEnabledChatModels = useAtomValue(availableEnabledChatModelsAtom);
  const AVAILABLE_IMAGE_MODELS = useAtomValue(availableImageModelsAtom);
  const providerHasApiKey = useAtomValue(providerHasApiKeyAtom);
  const providerIsAvailable = useAtomValue(providerIsAvailableAtom);
  const { user, isLoading, customerState, billingLoading, billingError } = useWebAuth();

  const usageSummary = useMemo(() => getBillingUsageSummary(customerState), [customerState]);
  const shouldHideUnavailableAgentOneModels =
    isLoading ||
    (Boolean(user) &&
      !billingError &&
      (billingLoading || !hasAgentOneCreditsAvailable(usageSummary)));

  const AVAILABLE_ENABLED_CHAT_MODELS = useMemo(
    () =>
      baseEnabledChatModels.filter(
        (model) => !shouldHideUnavailableAgentOneModels || !model.id.startsWith("agent-one-"),
      ),
    [baseEnabledChatModels, shouldHideUnavailableAgentOneModels],
  );

  const hasAvailableModels = AVAILABLE_ENABLED_CHAT_MODELS.length > 0;

  const getModelById = useMemo(
    () => (id: string) => AVAILABLE_MODELS.find((model) => model.id === id),
    [AVAILABLE_MODELS],
  );

  const getChatModelById = useMemo(
    () => (id: string) => AVAILABLE_ENABLED_CHAT_MODELS.find((model) => model.id === id),
    [AVAILABLE_ENABLED_CHAT_MODELS],
  );

  const getSmartDefaultChatModel = useMemo(
    () => () => {
      if (AVAILABLE_ENABLED_CHAT_MODELS.length === 0) {
        return undefined;
      }

      for (const providerId of PROVIDER_REGISTRY.map((provider) => provider.id)) {
        if (!providerIsAvailable[providerId]) {
          continue;
        }

        const preferredModels = PREFERRED_MODELS_BY_PROVIDER[providerId] || [];
        for (const preferredId of preferredModels) {
          const model = getChatModelById(preferredId);
          if (model) {
            return model;
          }
        }

        const firstModelFromProvider = AVAILABLE_ENABLED_CHAT_MODELS.find((model) =>
          model.id.startsWith(`${providerId}-`),
        );
        if (firstModelFromProvider) {
          return firstModelFromProvider;
        }
      }

      return AVAILABLE_ENABLED_CHAT_MODELS[0];
    },
    [AVAILABLE_ENABLED_CHAT_MODELS, getChatModelById, providerIsAvailable],
  );

  return {
    AVAILABLE_MODELS,
    AVAILABLE_CHAT_MODELS,
    AVAILABLE_ENABLED_CHAT_MODELS,
    AVAILABLE_IMAGE_MODELS,
    getModelById,
    getChatModelById,
    getSmartDefaultChatModel,
    hasAvailableModels,
    providerHasApiKey,
    DEFAULT_MODEL_CONFIG,
    DEFAULT_CHAT_MODEL_ID,
  };
}
