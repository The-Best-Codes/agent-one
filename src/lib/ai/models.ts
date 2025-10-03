import type { LanguageModel } from "ai";

import googleModelsData from "@/assets/model-lists/google-models.json";
import groqModelsData from "@/assets/model-lists/groq-models.json";
import openRouterModelsData from "@/assets/model-lists/openrouter-models.json";

import { google } from "./providers/google";
import { groq } from "./providers/groq";
import { openRouter } from "./providers/openrouter";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: LanguageModel;
  supportsToolUse: boolean;
}

function mapGoogleModels(): ModelConfig[] {
  return googleModelsData.models.map((model) => ({
    id: model.name,
    name: model.displayName,
    provider: "Google",
    model: google(model.name),
    supportsToolUse:
      model.supportedGenerationMethods.includes("generateContent"),
  }));
}

function mapGroqModels(): ModelConfig[] {
  return groqModelsData.data.map((model) => ({
    id: model.id,
    name: model.id,
    provider: "Groq",
    model: groq(model.id),
    supportsToolUse: true,
  }));
}

function mapOpenRouterModels(): ModelConfig[] {
  return openRouterModelsData.data.map((model) => ({
    id: model.id,
    name: model.name,
    provider: "OpenRouter",
    model: openRouter(model.id),
    supportsToolUse: (model.supported_parameters as string[]).includes("tools"),
  }));
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  ...mapGoogleModels(),
  ...mapGroqModels(),
  ...mapOpenRouterModels(),
];

export const DEFAULT_MODEL_ID = "groq-kimi-k2-instruct-0905";

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getDefaultModel(): ModelConfig {
  return getModelById(DEFAULT_MODEL_ID) || AVAILABLE_MODELS[0];
}
