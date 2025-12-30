import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { cerebrasModelsData } from "@/assets/model-lists/cerebras-models";
import { googleModelsData } from "@/assets/model-lists/google-models";
import { groqModelsData } from "@/assets/model-lists/groq-models";
import { openRouterModelsData } from "@/assets/model-lists/openrouter-models";
import {
  DEFAULT_CHAT_MODEL_ID,
  DEFAULT_MODEL_CONFIG,
  type ModelConfig,
  type ModelData,
} from "@/lib/ai/models";
import { getCerebras } from "@/lib/ai/providers/cerebras";
import { getGoogle } from "@/lib/ai/providers/google";
import { getGroq } from "@/lib/ai/providers/groq";
import { getOpenRouter } from "@/lib/ai/providers/openrouter";
import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/settings-atoms";

const getPartAfterSlash = (str: string) => {
  try {
    if (!str) return str;
    if (str.includes("/")) {
      const partAfterSlash = str.slice(str.indexOf("/") + 1);
      return partAfterSlash;
    }
    return str;
  } catch {
    return str;
  }
};

function mapGoogleModels(
  googleProvider: ReturnType<typeof getGoogle>,
): ModelData[] {
  return googleModelsData.models.map((model) => ({
    id: `google-${model.name}`,
    name: model.displayName,
    provider: "Google",
    model: googleProvider(model.name),
    supportsToolUse:
      model.supportedGenerationMethods.includes("generateContent"),
  }));
}

function mapGroqModels(groqProvider: ReturnType<typeof getGroq>): ModelData[] {
  return groqModelsData.data.map((model) => ({
    id: `groq-${model.id}`,
    name: getPartAfterSlash(model.id),
    provider: "Groq",
    model: groqProvider(model.id),
    supportsToolUse: true,
  }));
}

function mapCerebrasModels(
  cerebrasProvider: ReturnType<typeof getCerebras>,
): ModelData[] {
  return cerebrasModelsData.data.map((model) => ({
    id: `cerebras-${model.id}`,
    name: model.id,
    provider: "Cerebras",
    model: cerebrasProvider(model.id),
    supportsToolUse: true,
  }));
}

function mapOpenRouterModels(
  openRouterProvider: ReturnType<typeof getOpenRouter>,
): ModelData[] {
  return openRouterModelsData.data.map((model) => ({
    id: `openrouter-${model.id}`,
    name: model.name,
    provider: "OpenRouter",
    model: openRouterProvider(model.id),
    supportsToolUse: (model.supported_parameters as string[]).includes("tools"),
  }));
}

function mapGoogleChatModels(
  googleProvider: ReturnType<typeof getGoogle>,
): ModelData[] {
  return googleModelsData.models
    .filter((model) =>
      model.supportedGenerationMethods.includes("generateContent"),
    )
    .map((model) => ({
      id: `google-${model.name}`,
      name: model.displayName,
      provider: "Google",
      model: googleProvider(model.name),
      supportsToolUse: true,
    }));
}

function mapGoogleImageModels(
  googleProvider: ReturnType<typeof getGoogle>,
): ModelData[] {
  return googleModelsData.models
    .filter((model) => model.supportedGenerationMethods.includes("predict"))
    .map((model) => ({
      id: `google-${model.name}`,
      name: model.displayName,
      provider: "Google",
      model: googleProvider(model.name),
      supportsToolUse: false,
    }));
}

function mapGroqChatModels(
  groqProvider: ReturnType<typeof getGroq>,
): ModelData[] {
  return groqModelsData.data
    .filter(
      (model) => !model.id.includes("whisper") && !model.id.includes("tts"),
    )
    .map((model) => ({
      id: `groq-${model.id}`,
      name: getPartAfterSlash(model.id),
      provider: "Groq",
      model: groqProvider(model.id),
      supportsToolUse: true,
    }));
}

function mapCerebrasChatModels(
  cerebrasProvider: ReturnType<typeof getCerebras>,
): ModelData[] {
  return cerebrasModelsData.data.map((model) => ({
    id: `cerebras-${model.id}`,
    name: model.id,
    provider: "Cerebras",
    model: cerebrasProvider(model.id),
    supportsToolUse: true,
  }));
}

function mapOpenRouterChatModels(
  openRouterProvider: ReturnType<typeof getOpenRouter>,
): ModelData[] {
  return openRouterModelsData.data
    .filter(
      (model) =>
        model.architecture.output_modalities.includes("text") &&
        !model.architecture.modality.endsWith("image"),
    )
    .map((model) => ({
      id: `openrouter-${model.id}`,
      name: model.name,
      provider: "OpenRouter",
      model: openRouterProvider(model.id),
      supportsToolUse: (model.supported_parameters as string[]).includes(
        "tools",
      ),
    }));
}

function mapOpenRouterImageModels(
  openRouterProvider: ReturnType<typeof getOpenRouter>,
): ModelData[] {
  return openRouterModelsData.data
    .filter((model) => model.architecture.output_modalities.includes("image"))
    .map((model) => ({
      id: `openrouter-${model.id}`,
      name: model.name,
      provider: "OpenRouter",
      model: openRouterProvider(model.id),
      supportsToolUse: false,
    }));
}

export function useModelCatalog() {
  const googleApiKey = useAtomValue(googleGenerativeAiApiKeyAtom);
  const groqApiKey = useAtomValue(groqApiKeyAtom);
  const cerebrasApiKey = useAtomValue(cerebrasApiKeyAtom);
  const openrouterApiKey = useAtomValue(openrouterApiKeyAtom);

  const googleProvider = useMemo(
    () =>
      getGoogle(
        googleApiKey || import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY,
      ),
    [googleApiKey],
  );

  const groqProvider = useMemo(
    () => getGroq(groqApiKey || import.meta.env.AGENT_ONE_GROQ_API_KEY),
    [groqApiKey],
  );

  const cerebrasProvider = useMemo(
    () =>
      getCerebras(cerebrasApiKey || import.meta.env.AGENT_ONE_CEREBRAS_API_KEY),
    [cerebrasApiKey],
  );

  const openRouterProvider = useMemo(
    () =>
      getOpenRouter(
        openrouterApiKey || import.meta.env.AGENT_ONE_OPENROUTER_API_KEY,
      ),
    [openrouterApiKey],
  );

  const AVAILABLE_MODELS = useMemo(() => {
    return [
      ...mapCerebrasModels(cerebrasProvider),
      ...mapGoogleModels(googleProvider),
      ...mapGroqModels(groqProvider),
      ...mapOpenRouterModels(openRouterProvider),
    ];
  }, [googleProvider, groqProvider, cerebrasProvider, openRouterProvider]);

  const AVAILABLE_CHAT_MODELS = useMemo(() => {
    return [
      ...mapCerebrasChatModels(cerebrasProvider),
      ...mapGoogleChatModels(googleProvider),
      ...mapGroqChatModels(groqProvider),
      ...mapOpenRouterChatModels(openRouterProvider),
    ];
  }, [googleProvider, groqProvider, cerebrasProvider, openRouterProvider]);

  const AVAILABLE_IMAGE_MODELS = useMemo(() => {
    return [
      ...mapGoogleImageModels(googleProvider),
      ...mapOpenRouterImageModels(openRouterProvider),
    ];
  }, [googleProvider, openRouterProvider]);

  const getModelByIdMemoized = useMemo(
    () => (id: string) => AVAILABLE_MODELS.find((model) => model.id === id),
    [AVAILABLE_MODELS],
  );

  const getDefaultChatModelMemoized = useMemo(
    () => () =>
      getModelByIdMemoized(DEFAULT_CHAT_MODEL_ID) || AVAILABLE_CHAT_MODELS[0],
    [AVAILABLE_CHAT_MODELS, getModelByIdMemoized],
  );

  return {
    AVAILABLE_MODELS,
    AVAILABLE_CHAT_MODELS,
    AVAILABLE_IMAGE_MODELS,
    getModelById: getModelByIdMemoized,
    getDefaultChatModel: getDefaultChatModelMemoized,
    DEFAULT_MODEL_CONFIG,
    DEFAULT_CHAT_MODEL_ID,
  };
}

export type { ModelConfig, ModelData };
