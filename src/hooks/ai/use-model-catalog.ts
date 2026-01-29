import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  type ModelsDevData,
  modelsDevData,
  type ModelsDevModel,
} from "@/assets/model-lists/models-dev";
import { getCerebras } from "@/lib/ai/providers/cerebras";
import { getGoogle } from "@/lib/ai/providers/google";
import { getGroq } from "@/lib/ai/providers/groq";
import { getOpenCode } from "@/lib/ai/providers/opencode";
import { getOpenRouter } from "@/lib/ai/providers/openrouter";
import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  opencodeApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/api-key-atoms";
import {
  cerebrasConfigAtom,
  googleConfigAtom,
  groqConfigAtom,
  opencodeConfigAtom,
  openrouterConfigAtom,
} from "@/lib/jotai/provider-atoms";

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

const PREFERRED_MODELS_BY_PROVIDER: Record<string, string[]> = {
  openrouter: ["openrouter-x-ai/grok-4.1-fast"],
  groq: ["groq-moonshotai/kimi-k2-instruct-0905"],
  google: ["google-gemini-2.5-flash"],
  cerebras: ["cerebras-zai-glm-4.7"],
  opencode: ["opencode-claude-sonnet-4-5"],
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
  const googleApiKey = useAtomValue(googleGenerativeAiApiKeyAtom);
  const groqApiKey = useAtomValue(groqApiKeyAtom);
  const cerebrasApiKey = useAtomValue(cerebrasApiKeyAtom);
  const openrouterApiKey = useAtomValue(openrouterApiKeyAtom);
  const opencodeApiKey = useAtomValue(opencodeApiKeyAtom);

  const cerebrasConfig = useAtomValue(cerebrasConfigAtom);
  const googleConfig = useAtomValue(googleConfigAtom);
  const groqConfig = useAtomValue(groqConfigAtom);
  const openrouterConfig = useAtomValue(openrouterConfigAtom);
  const opencodeConfig = useAtomValue(opencodeConfigAtom);

  const providerHasApiKey = useMemo(
    () => ({
      google: Boolean(
        googleApiKey || import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY,
      ),
      groq: Boolean(groqApiKey || import.meta.env.AGENT_ONE_GROQ_API_KEY),
      cerebras: Boolean(
        cerebrasApiKey || import.meta.env.AGENT_ONE_CEREBRAS_API_KEY,
      ),
      openrouter: Boolean(
        openrouterApiKey || import.meta.env.AGENT_ONE_OPENROUTER_API_KEY,
      ),
      opencode: Boolean(
        opencodeApiKey || import.meta.env.AGENT_ONE_OPENCODE_API_KEY,
      ),
    }),
    [
      googleApiKey,
      groqApiKey,
      cerebrasApiKey,
      openrouterApiKey,
      opencodeApiKey,
    ],
  );

  const providerIsAvailable = useMemo(
    () => ({
      google: providerHasApiKey.google && googleConfig.enabled,
      groq: providerHasApiKey.groq && groqConfig.enabled,
      cerebras: providerHasApiKey.cerebras && cerebrasConfig.enabled,
      openrouter: providerHasApiKey.openrouter && openrouterConfig.enabled,
      opencode: providerHasApiKey.opencode && opencodeConfig.enabled,
    }),
    [
      providerHasApiKey,
      googleConfig.enabled,
      groqConfig.enabled,
      cerebrasConfig.enabled,
      openrouterConfig.enabled,
      opencodeConfig.enabled,
    ],
  );

  const googleProvider = useMemo(
    () =>
      getGoogle(
        googleApiKey || import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY,
        googleConfig.headers,
      ),
    [googleApiKey, googleConfig.headers],
  );

  const groqProvider = useMemo(
    () =>
      getGroq(
        groqApiKey || import.meta.env.AGENT_ONE_GROQ_API_KEY,
        groqConfig.headers,
      ),
    [groqApiKey, groqConfig.headers],
  );

  const cerebrasProvider = useMemo(
    () =>
      getCerebras(
        cerebrasApiKey || import.meta.env.AGENT_ONE_CEREBRAS_API_KEY,
        cerebrasConfig.headers,
      ),
    [cerebrasApiKey, cerebrasConfig.headers],
  );

  const openRouterProvider = useMemo(
    () =>
      getOpenRouter(
        openrouterApiKey || import.meta.env.AGENT_ONE_OPENROUTER_API_KEY,
        openrouterConfig.headers,
      ),
    [openrouterApiKey, openrouterConfig.headers],
  );

  const openCodeProvider = useMemo(
    () =>
      getOpenCode(
        opencodeApiKey || import.meta.env.AGENT_ONE_OPENCODE_API_KEY,
        opencodeConfig.headers,
      ),
    [opencodeApiKey, opencodeConfig.headers],
  );

  const AVAILABLE_MODELS = useMemo(() => {
    return [
      ...mapModelsDevModels("cerebras", "Cerebras", cerebrasProvider),
      ...mapModelsDevModels("google", "Google", googleProvider),
      ...mapModelsDevModels("groq", "Groq", groqProvider),
      ...mapModelsDevModels("openrouter", "OpenRouter", openRouterProvider),
    ];
  }, [googleProvider, groqProvider, cerebrasProvider, openRouterProvider]);

  const AVAILABLE_CHAT_MODELS = useMemo(() => {
    return [
      ...mapModelsDevModels(
        "cerebras",
        "Cerebras",
        cerebrasProvider,
        isChatModel,
      ),
      ...mapModelsDevModels("google", "Google", googleProvider, isChatModel),
      ...mapModelsDevModels("groq", "Groq", groqProvider, isChatModel),
      ...mapModelsDevModels(
        "openrouter",
        "OpenRouter",
        openRouterProvider,
        isChatModel,
      ),
      ...mapModelsDevModels(
        "opencode",
        "OpenCode",
        openCodeProvider,
        isChatModel,
      ),
    ];
  }, [
    googleProvider,
    groqProvider,
    cerebrasProvider,
    openRouterProvider,
    openCodeProvider,
  ]);

  const AVAILABLE_IMAGE_MODELS = useMemo(() => {
    return [
      ...mapModelsDevModels("google", "Google", googleProvider, isImageModel),
      ...mapModelsDevModels(
        "openrouter",
        "OpenRouter",
        openRouterProvider,
        isImageModel,
      ),
    ];
  }, [googleProvider, openRouterProvider]);

  const AVAILABLE_CHAT_MODELS_WITH_API_KEY = useMemo(() => {
    const providerIdToName: Record<string, string> = {
      google: "Google",
      groq: "Groq",
      cerebras: "Cerebras",
      openrouter: "OpenRouter",
      opencode: "OpenCode",
    };

    return AVAILABLE_CHAT_MODELS.filter((model) => {
      const providerId = Object.entries(providerIdToName).find(
        ([, name]) => name === model.provider,
      )?.[0];
      return providerId
        ? providerIsAvailable[providerId as keyof typeof providerIsAvailable]
        : false;
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

      const providerOrder = [
        "openrouter",
        "groq",
        "google",
        "cerebras",
        "opencode",
      ];

      for (const providerId of providerOrder) {
        if (
          !providerIsAvailable[providerId as keyof typeof providerIsAvailable]
        ) {
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
