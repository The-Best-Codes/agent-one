import type { LanguageModel } from "ai";

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

export const DEFAULT_CHAT_MODEL_ID = "groq-moonshotai/kimi-k2-instruct-0905";
