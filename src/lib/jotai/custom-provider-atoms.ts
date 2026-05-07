import { atom, type Atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";

const STORAGE_KEY = "agent-one-custom-providers";

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  enabled: boolean;
  models: ProviderModelMetadata[];
}

export type NewCustomProviderData = Omit<CustomProvider, "id" | "enabled">;

export const customProvidersAtom = atomWithStorage<CustomProvider[]>(STORAGE_KEY, [], undefined, {
  getOnInit: true,
});

export const customProviderIdsAtom = atom((get) =>
  get(customProvidersAtom).map((provider) => provider.id),
);

export const customProviderSearchItemsAtom = atom((get) =>
  get(customProvidersAtom).map((provider) => ({
    id: provider.id,
    name: provider.name,
  })),
);

export const addCustomProviderAtom = atom(null, (get, set, provider: NewCustomProviderData) => {
  const existing = get(customProvidersAtom);
  const newProvider: CustomProvider = {
    ...provider,
    id: crypto.randomUUID(),
    enabled: true,
  };
  set(customProvidersAtom, [newProvider, ...existing]);
  return newProvider.id;
});

export const updateCustomProviderAtom = atom(
  null,
  (get, set, id: string, updates: Partial<Omit<CustomProvider, "id">>) => {
    const existing = get(customProvidersAtom);
    const sanitizedUpdates = { ...updates };
    if ("name" in sanitizedUpdates && !sanitizedUpdates.name?.trim()) {
      sanitizedUpdates.name = "Unnamed provider";
    }
    if (sanitizedUpdates.models) {
      sanitizedUpdates.models = sanitizedUpdates.models.map(normalizeProviderModelMetadata);
    }
    set(
      customProvidersAtom,
      existing.map((p) => (p.id === id ? { ...p, ...sanitizedUpdates } : p)),
    );
  },
);

export const deleteCustomProviderAtom = atom(null, (get, set, id: string) => {
  const existing = get(customProvidersAtom);
  set(
    customProvidersAtom,
    existing.filter((p) => p.id !== id),
  );
});

export const normalizedCustomProvidersAtom = atom((get) => {
  return get(customProvidersAtom).map((provider) => ({
    ...provider,
    models: provider.models.map(normalizeProviderModelMetadata),
  }));
});

export const hasEnabledCustomProviderAtom = atom((get) =>
  get(customProvidersAtom).some((provider) => provider.enabled),
);

const customProviderAtomCache = new Map<string, Atom<CustomProvider | undefined>>();

export function getCustomProviderAtom(providerId: string) {
  const cachedAtom = customProviderAtomCache.get(providerId);
  if (cachedAtom) {
    return cachedAtom;
  }

  const providerAtom = atom((get) =>
    get(customProvidersAtom).find((provider) => provider.id === providerId),
  );

  customProviderAtomCache.set(providerId, providerAtom);
  return providerAtom;
}
