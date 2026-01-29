import type { LanguageModel } from "ai";

import { getCerebras } from "@/lib/ai/providers/cerebras";
import { getGoogle } from "@/lib/ai/providers/google";
import { getGroq } from "@/lib/ai/providers/groq";
import { getOpenRouter } from "@/lib/ai/providers/openrouter";

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
    id: "openrouter",
    label: "OpenRouter",
    storageKey: "OPENROUTER_API_KEY",
    envKey: "AGENT_ONE_OPENROUTER_API_KEY",
    factory: getOpenRouter as ProviderFactory,
    priority: 1,
  },
  {
    id: "groq",
    label: "Groq",
    storageKey: "GROQ_API_KEY",
    envKey: "AGENT_ONE_GROQ_API_KEY",
    factory: getGroq as ProviderFactory,
    priority: 2,
  },
  {
    id: "google",
    label: "Google Generative AI",
    storageKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    envKey: "AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY",
    factory: getGoogle as ProviderFactory,
    priority: 3,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    storageKey: "CEREBRAS_API_KEY",
    envKey: "AGENT_ONE_CEREBRAS_API_KEY",
    factory: getCerebras as ProviderFactory,
    priority: 4,
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
