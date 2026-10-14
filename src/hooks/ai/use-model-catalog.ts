import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { useMemo } from "react";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
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
  getProviderById,
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
  getLanguageModel: () => LanguageModel;
  supportsToolUse: boolean;
  supportsImageInput: boolean;
  supportsAttachments: boolean;
  supportsReasoning: boolean;
  contextWindow?: number;
}

export type ToolBehavior = "default" | "ask" | "yolo" | "disable";

export const REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
  toolBehavior?: ToolBehavior;
  reasoningEffort?: ReasoningEffort;
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
  toolBehavior: "default",
  reasoningEffort: undefined,
};

export function getToolBehavior(modelConfig: ModelConfig): ToolBehavior {
  return modelConfig.toolBehavior ?? "default";
}

export function getReasoningEffort(modelConfig: ModelConfig): ReasoningEffort | undefined {
  return REASONING_EFFORTS.find((effort) => effort === modelConfig.reasoningEffort);
}

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

interface ModelLists {
  models: ModelData[];
  chatModels: ModelData[];
}

function lazy<T>(create: () => T): () => T {
  let value: { current: T } | undefined;
  return () => {
    value ??= { current: create() };
    return value.current;
  };
}

function toModelLists(entries: { model: ModelData; supportsText?: boolean }[]): ModelLists {
  return {
    models: entries.map((entry) => entry.model),
    chatModels: entries.filter((entry) => entry.supportsText).map((entry) => entry.model),
  };
}

function mapDirectoryModels(
  modelDirectoryData: ModelDirectoryData,
  providerId: string,
  providerName: string,
  createModel: (modelId: string) => LanguageModel,
  overrides: ProviderModelMetadata[],
): ModelLists {
  const modelMap = new Map(
    getProviderModels(modelDirectoryData, providerId)
      .map(mapDirectoryModelToMetadata)
      .map((model) => [model.id, model] as const),
  );

  for (const override of overrides) {
    const directoryModel = modelMap.get(override.id);
    modelMap.set(
      override.id,
      normalizeProviderModelMetadata({
        ...directoryModel,
        ...override,
        supportsImageInput: override.supportsImageInput ?? directoryModel?.supportsImageInput,
        supportsAttachments: override.supportsAttachments ?? directoryModel?.supportsAttachments,
        supportsReasoning: override.supportsReasoning ?? directoryModel?.supportsReasoning,
      }),
    );
  }

  return toModelLists(
    Array.from(modelMap.values())
      .filter((model) => providerId !== "agent-one" || model.id === "agent-one-auto")
      .map((model) => ({
        supportsText: model.supportsText,
        model: {
          id: `${providerId}-${model.id}`,
          name: providerId === "agent-one" ? "Default" : (model.name ?? model.id),
          provider: providerName,
          providerId,
          getLanguageModel: lazy(() => createModel(model.id)),
          supportsToolUse: model.supportsTools,
          supportsImageInput: model.supportsImageInput ?? false,
          supportsAttachments: model.supportsAttachments ?? false,
          supportsReasoning: model.supportsReasoning ?? false,
          contextWindow: model.contextWindow,
        },
      })),
  );
}

function mapProviderModels(
  idPrefix: string,
  provider: { id: string; name: string; models: ProviderModelMetadata[] },
  createModel: (modelId: string) => LanguageModel,
): ModelLists {
  return toModelLists(
    provider.models.map(normalizeProviderModelMetadata).map((model) => ({
      supportsText: model.supportsText,
      model: {
        id: `${idPrefix}-${provider.id}-${model.id}`,
        name: model.name || model.id,
        provider: provider.name,
        providerId: provider.id,
        getLanguageModel: lazy(() => createModel(model.id)),
        supportsToolUse: model.supportsTools,
        supportsImageInput: model.supportsImageInput ?? false,
        supportsAttachments: model.supportsAttachments ?? false,
        supportsReasoning: model.supportsReasoning ?? false,
        contextWindow: model.contextWindow,
      },
    })),
  );
}

function mapCustomProviderModels(provider: CustomProvider, apiKey: string): ModelLists {
  const getInstance = lazy(() => createCustomProvider(provider, apiKey));
  return mapProviderModels("custom", provider, (modelId) => getInstance().languageModel(modelId));
}

function mapLocalProviderModels(provider: LocalProvider): ModelLists {
  const getInstance = lazy(() => createLocalProvider(provider));
  return mapProviderModels("local", provider, (modelId) => getInstance().languageModel(modelId));
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

const directoryProviderModelsAtomFamily = atomFamily((providerId: ProviderId) =>
  atom((get) => {
    const provider = getProviderById(providerId);
    const apiKey = getEffectiveApiKey(providerId, get(apiKeyAtomFamily(providerId)));
    const headers = get(providerHeadersAtomFamily(providerId));
    const getInstance = lazy(() => provider.factory(apiKey, headers));

    return mapDirectoryModels(
      get(modelDirectoryDataAtom),
      provider.id,
      provider.label,
      (modelId) => getInstance().languageModel(modelId),
      get(providerModelsAtomFamily(providerId)),
    );
  }),
);

const availableModelListsAtom = atom((get): ModelLists => {
  const customProviderApiKeys = get(customProviderApiKeysAtom);

  const lists = [
    ...PROVIDER_REGISTRY.map((provider) => get(directoryProviderModelsAtomFamily(provider.id))),
    ...get(normalizedLocalProvidersAtom)
      .filter((provider) => provider.enabled)
      .map((provider) => mapLocalProviderModels(provider)),
    ...get(normalizedCustomProvidersAtom)
      .filter((provider) => provider.enabled)
      .map((provider) =>
        mapCustomProviderModels(provider, customProviderApiKeys[provider.id] ?? ""),
      ),
  ];

  return {
    models: lists.flatMap((list) => list.models),
    chatModels: lists.flatMap((list) => list.chatModels),
  };
});

const availableEnabledChatModelsAtom = atom((get) => {
  const hideAgentOneModels = get(hideAgentOneModelsAtom);
  const availableChatModels = get(availableModelListsAtom).chatModels;
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
  const { models } = useAtomValue(availableModelListsAtom);
  const baseEnabledChatModels = useAtomValue(availableEnabledChatModelsAtom);
  const providerHasApiKey = useAtomValue(providerHasApiKeyAtom);
  const providerIsAvailable = useAtomValue(providerIsAvailableAtom);
  const { isApiKeysLoading } = useApiKeys();
  const { user, isLoading, customerState } = useWebAuth();

  const shouldHideUnavailableAgentOneModels = isLoading || !user;
  const isModelCatalogLoading = isApiKeysLoading || isLoading || (Boolean(user) && !customerState);

  const AVAILABLE_ENABLED_CHAT_MODELS = useMemo(
    () =>
      baseEnabledChatModels.filter(
        (model) => !shouldHideUnavailableAgentOneModels || !model.id.startsWith("agent-one-"),
      ),
    [baseEnabledChatModels, shouldHideUnavailableAgentOneModels],
  );

  const hasAvailableModels = AVAILABLE_ENABLED_CHAT_MODELS.length > 0;

  const getModelById = useMemo(() => {
    const modelsById = new Map(models.map((model) => [model.id, model]));
    return (id: string) => modelsById.get(id);
  }, [models]);

  const getChatModelById = useMemo(() => {
    const modelsById = new Map(AVAILABLE_ENABLED_CHAT_MODELS.map((model) => [model.id, model]));
    return (id: string) => modelsById.get(id);
  }, [AVAILABLE_ENABLED_CHAT_MODELS]);

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
    AVAILABLE_ENABLED_CHAT_MODELS,
    getModelById,
    getChatModelById,
    getSmartDefaultChatModel,
    hasAvailableModels,
    isModelCatalogLoading,
    providerHasApiKey,
    DEFAULT_MODEL_CONFIG,
    DEFAULT_CHAT_MODEL_ID,
  };
}
