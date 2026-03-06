import { atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";

import {
  PROVIDER_REGISTRY,
  type ProviderId,
  type ProviderStorageKey,
} from "@/lib/ai/providers/registry";
import { loadable } from "@/lib/jotai/loadable";
import { keyringStorage } from "@/lib/storage/keyring-storage";

function createApiKeyAtoms(storageKey: ProviderStorageKey) {
  const baseAtom = atomWithStorage<string>(storageKey, "", keyringStorage, {
    getOnInit: true,
  });

  const unwrappedAtom = unwrap(baseAtom, (prev) => prev ?? "");
  const loadableAtom = loadable(baseAtom);

  return { atom: unwrappedAtom, loadableAtom, baseAtom };
}

export const apiKeyAtoms = Object.fromEntries(
  PROVIDER_REGISTRY.map((provider) => [provider.id, createApiKeyAtoms(provider.storageKey)]),
) as Record<ProviderId, ReturnType<typeof createApiKeyAtoms>>;

export function getApiKeyAtom(providerId: ProviderId) {
  return apiKeyAtoms[providerId].atom;
}

export function getApiKeyLoadableAtom(providerId: ProviderId) {
  return apiKeyAtoms[providerId].loadableAtom;
}

export function getApiKeyBaseAtom(providerId: ProviderId) {
  return apiKeyAtoms[providerId].baseAtom;
}

export const apiKeysLoadingAtom = atom((get) => {
  return PROVIDER_REGISTRY.some((p) => get(apiKeyAtoms[p.id].loadableAtom).state === "loading");
});
