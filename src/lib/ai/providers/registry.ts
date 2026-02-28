import type { LanguageModel } from "ai";

import { getAgentOne } from "./factories/agent-one";
import { getAnthropic } from "./factories/anthropic";
import { getCerebras } from "./factories/cerebras";
import { getCohere } from "./factories/cohere";
import { getDeepInfra } from "./factories/deepinfra";
import { getDeepSeek } from "./factories/deepseek";
import { getFireworks } from "./factories/fireworks";
import { getGoogle } from "./factories/google";
import { getGroq } from "./factories/groq";
import { getMistral } from "./factories/mistral";
import { getOpenAI } from "./factories/openai";
import { getOpenRouter } from "./factories/openrouter";
import { getPerplexity } from "./factories/perplexity";
import { getTogetherAI } from "./factories/togetherai";
import { getXai } from "./factories/xai";

export type ProviderFactory = (
  apiKey: string,
  headers?: Record<string, string>,
) => { languageModel: (modelId: string) => LanguageModel };

export interface ProviderDefinition {
  id: string;
  label: string;
  storageKey: string;
  envKey: string;
  factory: ProviderFactory;
  priority: number;
}

export const PROVIDER_REGISTRY = [
  {
    id: "agent-one",
    label: "AgentOne",
    storageKey: "AGENT_ONE_API_KEY",
    envKey: "AGENT_ONE_API_KEY",
    factory: getAgentOne as ProviderFactory,
    priority: 0,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    storageKey: "ANTHROPIC_API_KEY",
    envKey: "AGENT_ONE_ANTHROPIC_API_KEY",
    factory: getAnthropic as ProviderFactory,
    priority: 1,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    storageKey: "CEREBRAS_API_KEY",
    envKey: "AGENT_ONE_CEREBRAS_API_KEY",
    factory: getCerebras as ProviderFactory,
    priority: 2,
  },
  {
    id: "cohere",
    label: "Cohere",
    storageKey: "COHERE_API_KEY",
    envKey: "AGENT_ONE_COHERE_API_KEY",
    factory: getCohere as ProviderFactory,
    priority: 3,
  },
  {
    id: "deepinfra",
    label: "DeepInfra",
    storageKey: "DEEPINFRA_API_KEY",
    envKey: "AGENT_ONE_DEEPINFRA_API_KEY",
    factory: getDeepInfra as ProviderFactory,
    priority: 4,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    storageKey: "DEEPSEEK_API_KEY",
    envKey: "AGENT_ONE_DEEPSEEK_API_KEY",
    factory: getDeepSeek as ProviderFactory,
    priority: 5,
  },
  {
    id: "fireworks-ai",
    label: "Fireworks AI",
    storageKey: "FIREWORKS_API_KEY",
    envKey: "AGENT_ONE_FIREWORKS_API_KEY",
    factory: getFireworks as ProviderFactory,
    priority: 6,
  },
  {
    id: "google",
    label: "Google Generative AI",
    storageKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    envKey: "AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY",
    factory: getGoogle as ProviderFactory,
    priority: 7,
  },
  {
    id: "groq",
    label: "Groq",
    storageKey: "GROQ_API_KEY",
    envKey: "AGENT_ONE_GROQ_API_KEY",
    factory: getGroq as ProviderFactory,
    priority: 8,
  },
  {
    id: "mistral",
    label: "Mistral",
    storageKey: "MISTRAL_API_KEY",
    envKey: "AGENT_ONE_MISTRAL_API_KEY",
    factory: getMistral as ProviderFactory,
    priority: 9,
  },
  {
    id: "openai",
    label: "OpenAI",
    storageKey: "OPENAI_API_KEY",
    envKey: "AGENT_ONE_OPENAI_API_KEY",
    factory: getOpenAI as ProviderFactory,
    priority: 10,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    storageKey: "OPENROUTER_API_KEY",
    envKey: "AGENT_ONE_OPENROUTER_API_KEY",
    factory: getOpenRouter as ProviderFactory,
    priority: 11,
  },
  {
    id: "perplexity",
    label: "Perplexity",
    storageKey: "PERPLEXITY_API_KEY",
    envKey: "AGENT_ONE_PERPLEXITY_API_KEY",
    factory: getPerplexity as ProviderFactory,
    priority: 12,
  },
  {
    id: "togetherai",
    label: "Together AI",
    storageKey: "TOGETHERAI_API_KEY",
    envKey: "AGENT_ONE_TOGETHERAI_API_KEY",
    factory: getTogetherAI as ProviderFactory,
    priority: 13,
  },
  {
    id: "xai",
    label: "xAI",
    storageKey: "XAI_API_KEY",
    envKey: "AGENT_ONE_XAI_API_KEY",
    factory: getXai as ProviderFactory,
    priority: 14,
  },
] as const satisfies readonly ProviderDefinition[];

export type ProviderId = (typeof PROVIDER_REGISTRY)[number]["id"];
export type ProviderStorageKey =
  (typeof PROVIDER_REGISTRY)[number]["storageKey"];

export const PROVIDER_IDS = PROVIDER_REGISTRY.map((p) => p.id);

export function getProviderById(id: ProviderId): ProviderDefinition {
  const provider = PROVIDER_REGISTRY.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}

export function getProviderByStorageKey(
  key: ProviderStorageKey,
): ProviderDefinition {
  const provider = PROVIDER_REGISTRY.find((p) => p.storageKey === key);
  if (!provider) throw new Error(`Unknown storage key: ${key}`);
  return provider;
}

export function getEnvApiKey(providerId: ProviderId): string | undefined {
  const provider = getProviderById(providerId);
  return import.meta.env[provider.envKey] as string | undefined;
}

export function getEffectiveApiKey(
  providerId: ProviderId,
  storedKey: string,
): string {
  return storedKey || getEnvApiKey(providerId) || "";
}

export function hasApiKey(providerId: ProviderId, storedKey: string): boolean {
  return Boolean(storedKey || getEnvApiKey(providerId));
}

export function hasEnvKey(providerId: ProviderId): boolean {
  return Boolean(getEnvApiKey(providerId));
}
