import { atom, type Atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";

export interface LocalProvider {
  id: string;
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  enabled: boolean;
  models: ProviderModelMetadata[];
}

const OLLAMA_PROVIDER_ID = "ollama";
const LM_STUDIO_PROVIDER_ID = "lm-studio";
const STORAGE_KEY = "agent-one-local-providers";

const DEFAULT_LOCAL_PROVIDERS: LocalProvider[] = [
  {
    id: OLLAMA_PROVIDER_ID,
    name: "Ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    headers: {
      Origin: "http://localhost",
    },
    enabled: true,
    models: [],
  },
  {
    id: LM_STUDIO_PROVIDER_ID,
    name: "LM Studio",
    baseUrl: "http://127.0.0.1:1234/v1",
    headers: {},
    enabled: true,
    models: [],
  },
];

function normalizeLocalProvider(provider: LocalProvider): LocalProvider {
  return {
    ...provider,
    name: provider.name.trim() || "Unnamed provider",
    models: provider.models.map(normalizeProviderModelMetadata),
  };
}

export const localProvidersAtom = atomWithStorage<LocalProvider[]>(
  STORAGE_KEY,
  DEFAULT_LOCAL_PROVIDERS,
  undefined,
  {
    getOnInit: true,
  },
);

export const normalizedLocalProvidersAtom = atom((get) => {
  const providers = get(localProvidersAtom);
  const byId = new Map(
    providers.map((provider) => [provider.id, normalizeLocalProvider(provider)]),
  );

  for (const provider of DEFAULT_LOCAL_PROVIDERS) {
    if (!byId.has(provider.id)) {
      byId.set(provider.id, provider);
    }
  }

  return Array.from(byId.values());
});

export const localProviderIdsAtom = atom((get) =>
  get(normalizedLocalProvidersAtom).map((p) => p.id),
);

export const localProviderSearchItemsAtom = atom((get) =>
  get(normalizedLocalProvidersAtom).map((provider) => ({
    id: provider.id,
    name: provider.name,
  })),
);

export const hasEnabledLocalProviderAtom = atom((get) =>
  get(normalizedLocalProvidersAtom).some((provider) => provider.enabled),
);

export const updateLocalProviderAtom = atom(
  null,
  (get, set, id: string, updates: Partial<Omit<LocalProvider, "id">>) => {
    const existing = get(normalizedLocalProvidersAtom);
    const sanitizedUpdates = { ...updates };

    if ("name" in sanitizedUpdates && !sanitizedUpdates.name?.trim()) {
      sanitizedUpdates.name = "Unnamed provider";
    }

    if (sanitizedUpdates.models) {
      sanitizedUpdates.models = sanitizedUpdates.models.map(normalizeProviderModelMetadata);
    }

    set(
      localProvidersAtom,
      existing.map((provider) =>
        provider.id === id
          ? normalizeLocalProvider({ ...provider, ...sanitizedUpdates })
          : provider,
      ),
    );
  },
);

const localProviderAtomCache = new Map<string, Atom<LocalProvider | undefined>>();

export function getLocalProviderAtom(providerId: string) {
  const cachedAtom = localProviderAtomCache.get(providerId);
  if (cachedAtom) {
    return cachedAtom;
  }

  const providerAtom = atom((get) =>
    get(normalizedLocalProvidersAtom).find((provider) => provider.id === providerId),
  );

  localProviderAtomCache.set(providerId, providerAtom);
  return providerAtom;
}
