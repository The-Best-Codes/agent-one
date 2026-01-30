import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const STORAGE_KEY = "agent-one-custom-providers";

export interface CustomProviderModel {
  id: string;
  name?: string;
  supportsTools: boolean;
  supportsImages: boolean;
}

export interface CustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  enabled: boolean;
  models: CustomProviderModel[];
}

export const customProvidersAtom = atomWithStorage<CustomProvider[]>(
  STORAGE_KEY,
  [],
  undefined,
  { getOnInit: true },
);

export const addCustomProviderAtom = atom(
  null,
  (get, set, provider: Omit<CustomProvider, "id" | "enabled">) => {
    const existing = get(customProvidersAtom);
    const newProvider: CustomProvider = {
      ...provider,
      id: crypto.randomUUID(),
      enabled: true,
    };
    set(customProvidersAtom, [...existing, newProvider]);
    return newProvider.id;
  },
);

export const updateCustomProviderAtom = atom(
  null,
  (get, set, id: string, updates: Partial<Omit<CustomProvider, "id">>) => {
    const existing = get(customProvidersAtom);
    set(
      customProvidersAtom,
      existing.map((p) => (p.id === id ? { ...p, ...updates } : p)),
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
