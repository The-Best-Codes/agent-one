import type { LanguageModel } from "ai";

import { cerebrasModelsData } from "@/assets/model-lists/cerebras-models";
import { googleModelsData } from "@/assets/model-lists/google-models";
import { groqModelsData } from "@/assets/model-lists/groq-models";
import { openRouterModelsData } from "@/assets/model-lists/openrouter-models";

import { cerebras } from "./providers/cerebras";
import { google } from "./providers/google";
import { groq } from "./providers/groq";
import { openRouter } from "./providers/openrouter";

export interface ModelData {
  id: string;
  name: string;
  provider: string;
  model: LanguageModel;
  supportsToolUse: boolean;
}

export interface ModelConfig {
  temperature: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  temperature: 0.7,
  maxTokens: undefined, // undefined means let the provider decide
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

const getPartAfterSlash = (str: string) => {
  try {
    if (!str) return str;
    if (str.includes("/")) {
      const partAfterSlash = str.slice(str.indexOf("/") + 1);
      return partAfterSlash;
    }
    return str;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return str;
  }
};

function mapGoogleModels(): ModelData[] {
  return googleModelsData.models.map((model) => ({
    id: `google-${model.name}`,
    name: model.displayName,
    provider: "Google",
    model: google(model.name),
    supportsToolUse:
      model.supportedGenerationMethods.includes("generateContent"),
  }));
}

function mapGroqModels(): ModelData[] {
  return groqModelsData.data.map((model) => ({
    id: `groq-${model.id}`,
    name: getPartAfterSlash(model.id),
    provider: "Groq",
    model: groq(model.id),
    supportsToolUse: true,
  }));
}

function mapCerebrasModels(): ModelData[] {
  return cerebrasModelsData.data.map((model) => ({
    id: `cerebras-${model.id}`,
    name: model.id,
    provider: "Cerebras",
    model: cerebras(model.id),
    supportsToolUse: true,
  }));
}

function mapOpenRouterModels(): ModelData[] {
  return openRouterModelsData.data.map((model) => ({
    id: `openrouter-${model.id}`,
    name: model.name,
    provider: "OpenRouter",
    model: openRouter(model.id),
    supportsToolUse: (model.supported_parameters as string[]).includes("tools"),
  }));
}

function mapGoogleChatModels(): ModelData[] {
  return googleModelsData.models
    .filter((model) =>
      model.supportedGenerationMethods.includes("generateContent"),
    )
    .map((model) => ({
      id: `google-${model.name}`,
      name: model.displayName,
      provider: "Google",
      model: google(model.name),
      supportsToolUse: true,
    }));
}

function mapGoogleImageModels(): ModelData[] {
  return googleModelsData.models
    .filter((model) => model.supportedGenerationMethods.includes("predict"))
    .map((model) => ({
      id: `google-${model.name}`,
      name: model.displayName,
      provider: "Google",
      model: google(model.name),
      supportsToolUse: false,
    }));
}

function mapGroqChatModels(): ModelData[] {
  return groqModelsData.data
    .filter(
      (model) => !model.id.includes("whisper") && !model.id.includes("tts"),
    )
    .map((model) => ({
      id: `groq-${model.id}`,
      name: getPartAfterSlash(model.id),
      provider: "Groq",
      model: groq(model.id),
      supportsToolUse: true,
    }));
}

function mapCerebrasChatModels(): ModelData[] {
  return cerebrasModelsData.data.map((model) => ({
    id: `cerebras-${model.id}`,
    name: model.id,
    provider: "Cerebras",
    model: cerebras(model.id),
    supportsToolUse: true,
  }));
}

function mapOpenRouterChatModels(): ModelData[] {
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
      model: openRouter(model.id),
      supportsToolUse: (model.supported_parameters as string[]).includes(
        "tools",
      ),
    }));
}

function mapOpenRouterImageModels(): ModelData[] {
  return openRouterModelsData.data
    .filter((model) => model.architecture.output_modalities.includes("image"))
    .map((model) => ({
      id: `openrouter-${model.id}`,
      name: model.name,
      provider: "OpenRouter",
      model: openRouter(model.id),
      supportsToolUse: false,
    }));
}

export const AVAILABLE_MODELS: ModelData[] = [
  ...mapCerebrasModels(),
  ...mapGoogleModels(),
  ...mapGroqModels(),
  ...mapOpenRouterModels(),
];

export const AVAILABLE_CHAT_MODELS: ModelData[] = [
  ...mapCerebrasChatModels(),
  ...mapGoogleChatModels(),
  ...mapGroqChatModels(),
  ...mapOpenRouterChatModels(),
];

export const AVAILABLE_IMAGE_MODELS: ModelData[] = [
  ...mapGoogleImageModels(),
  ...mapOpenRouterImageModels(),
];

export const DEFAULT_CHAT_MODEL_ID = "groq-moonshotai/kimi-k2-instruct-0905";

export function getModelById(id: string): ModelData | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getDefaultChatModel(): ModelData {
  return getModelById(DEFAULT_CHAT_MODEL_ID) || AVAILABLE_CHAT_MODELS[0];
}
