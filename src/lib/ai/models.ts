import type { LanguageModel } from "ai";

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

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "groq-kimi-k2-instruct-0905",
    name: "Kimi K2 Instruct",
    provider: "Groq",
    model: groq("moonshotai/kimi-k2-instruct-0905"),
    supportsToolUse: true,
  },
  {
    id: "groq-llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    model: groq("llama-3.3-70b-versatile"),
    supportsToolUse: true,
  },
  {
    id: "groq-openai-gpt-oss-120b",
    name: "GPT-OSS 120B",
    provider: "Groq",
    model: groq("openai/gpt-oss-120b"),
    supportsToolUse: true,
  },
  {
    id: "google-gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    model: google("gemini-2.0-flash"),
    supportsToolUse: true,
  },
  {
    id: "google-gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    model: google("gemini-2.5-flash"),
    supportsToolUse: true,
  },
  {
    id: "openrouter-nvidia-nemotron-nano-9b-v2",
    name: "Nemotron Nano 9B V2",
    provider: "OpenRouter",
    model: openRouter("nvidia/nemotron-nano-9b-v2"),
    supportsToolUse: true,
  },
  {
    id: "openrouter-xai-grok-4-fast-free",
    name: "Grok 4 Fast Free",
    provider: "OpenRouter",
    model: openRouter("x-ai/grok-4-fast:free"),
    supportsToolUse: true,
  },
];

export const DEFAULT_MODEL_ID = "groq-kimi-k2-instruct";

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getDefaultModel(): ModelConfig {
  return getModelById(DEFAULT_MODEL_ID) || AVAILABLE_MODELS[0];
}
