import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  type ModelsDevData,
  modelsDevData,
  type ModelsDevModel,
} from "@/assets/model-lists/models-dev";
import { createCustomProvider } from "@/lib/ai/providers/custom-provider-factory";
import {
  getEffectiveApiKey,
  hasApiKey,
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/ai/providers/registry";
import { apiKeyAtoms } from "@/lib/jotai/api-key-atoms";
import { hideAgentOneModelsAtom } from "@/lib/jotai/atoms";
import { customProviderApiKeysAtom } from "@/lib/jotai/custom-provider-api-key-atoms";
import { type CustomProvider, customProvidersAtom } from "@/lib/jotai/custom-provider-atoms";
import { providerConfigAtoms } from "@/lib/jotai/provider-atoms";

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

const PREFERRED_MODELS_BY_PROVIDER: Record<ProviderId, string[]> = {
  "agent-one": ["agent-one-balanced"],
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

function isChatModel(model: ModelsDevModel): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("text");
}

function isImageModel(model: ModelsDevModel): boolean {
  const outputModalities = model.modalities?.output ?? [];
  return outputModalities.includes("image");
}

export function useModelCatalog() {
  const hideAgentOneModels = useAtomValue(hideAgentOneModelsAtom);
  const agentOneKey = useAtomValue(apiKeyAtoms["agent-one"].atom);
  const openrouterKey = useAtomValue(apiKeyAtoms.openrouter.atom);
  const groqKey = useAtomValue(apiKeyAtoms.groq.atom);
  const googleKey = useAtomValue(apiKeyAtoms.google.atom);
  const cerebrasKey = useAtomValue(apiKeyAtoms.cerebras.atom);
  const openaiKey = useAtomValue(apiKeyAtoms.openai.atom);
  const anthropicKey = useAtomValue(apiKeyAtoms.anthropic.atom);
  const mistralKey = useAtomValue(apiKeyAtoms.mistral.atom);
  const deepseekKey = useAtomValue(apiKeyAtoms.deepseek.atom);
  const xaiKey = useAtomValue(apiKeyAtoms.xai.atom);
  const cohereKey = useAtomValue(apiKeyAtoms.cohere.atom);
  const deepinfraKey = useAtomValue(apiKeyAtoms.deepinfra.atom);
  const perplexityKey = useAtomValue(apiKeyAtoms.perplexity.atom);
  const togetheraiKey = useAtomValue(apiKeyAtoms.togetherai.atom);
  const fireworksAiKey = useAtomValue(apiKeyAtoms["fireworks-ai"].atom);

  const agentOneConfig = useAtomValue(providerConfigAtoms["agent-one"]);
  const openrouterConfig = useAtomValue(providerConfigAtoms.openrouter);
  const groqConfig = useAtomValue(providerConfigAtoms.groq);
  const googleConfig = useAtomValue(providerConfigAtoms.google);
  const cerebrasConfig = useAtomValue(providerConfigAtoms.cerebras);
  const openaiConfig = useAtomValue(providerConfigAtoms.openai);
  const anthropicConfig = useAtomValue(providerConfigAtoms.anthropic);
  const mistralConfig = useAtomValue(providerConfigAtoms.mistral);
  const deepseekConfig = useAtomValue(providerConfigAtoms.deepseek);
  const xaiConfig = useAtomValue(providerConfigAtoms.xai);
  const cohereConfig = useAtomValue(providerConfigAtoms.cohere);
  const deepinfraConfig = useAtomValue(providerConfigAtoms.deepinfra);
  const perplexityConfig = useAtomValue(providerConfigAtoms.perplexity);
  const togetheraiConfig = useAtomValue(providerConfigAtoms.togetherai);
  const fireworksAiConfig = useAtomValue(providerConfigAtoms["fireworks-ai"]);

  const customProviders = useAtomValue(customProvidersAtom);
  const customProviderApiKeys = useAtomValue(customProviderApiKeysAtom);

  const apiKeys = useMemo(
    () => ({
      "agent-one": agentOneKey,
      openrouter: openrouterKey,
      groq: groqKey,
      google: googleKey,
      cerebras: cerebrasKey,
      openai: openaiKey,
      anthropic: anthropicKey,
      mistral: mistralKey,
      deepseek: deepseekKey,
      xai: xaiKey,
      cohere: cohereKey,
      deepinfra: deepinfraKey,
      perplexity: perplexityKey,
      togetherai: togetheraiKey,
      "fireworks-ai": fireworksAiKey,
    }),
    [
      agentOneKey,
      openrouterKey,
      groqKey,
      googleKey,
      cerebrasKey,
      openaiKey,
      anthropicKey,
      mistralKey,
      deepseekKey,
      xaiKey,
      cohereKey,
      deepinfraKey,
      perplexityKey,
      togetheraiKey,
      fireworksAiKey,
    ],
  );

  const configs = useMemo(
    () => ({
      "agent-one": agentOneConfig,
      openrouter: openrouterConfig,
      groq: groqConfig,
      google: googleConfig,
      cerebras: cerebrasConfig,
      openai: openaiConfig,
      anthropic: anthropicConfig,
      mistral: mistralConfig,
      deepseek: deepseekConfig,
      xai: xaiConfig,
      cohere: cohereConfig,
      deepinfra: deepinfraConfig,
      perplexity: perplexityConfig,
      togetherai: togetheraiConfig,
      "fireworks-ai": fireworksAiConfig,
    }),
    [
      agentOneConfig,
      openrouterConfig,
      groqConfig,
      googleConfig,
      cerebrasConfig,
      openaiConfig,
      anthropicConfig,
      mistralConfig,
      deepseekConfig,
      xaiConfig,
      cohereConfig,
      deepinfraConfig,
      perplexityConfig,
      togetheraiConfig,
      fireworksAiConfig,
    ],
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
      mapModelsDevModels(p.id, p.label, providers[p.id].languageModel),
    );

    const customModels = customProviders
      .filter((p) => p.enabled)
      .flatMap((p) => mapCustomProviderModels(p, customProviderApiKeys[p.id] ?? ""));

    return [...builtInModels, ...customModels];
  }, [providers, customProviders, customProviderApiKeys]);

  const AVAILABLE_CHAT_MODELS = useMemo(() => {
    const builtInModels = PROVIDER_REGISTRY.flatMap((p) =>
      mapModelsDevModels(p.id, p.label, providers[p.id].languageModel, isChatModel),
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
      mapModelsDevModels(p.id, p.label, providers[p.id].languageModel, isImageModel),
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
