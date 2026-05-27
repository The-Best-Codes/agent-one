import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { atomWithStorage, unwrap } from "jotai/utils";

import {
  PROVIDER_REGISTRY,
  type ProviderId,
  type ProviderStorageKey,
} from "@/lib/ai/providers/registry";
import { loadable } from "@/lib/jotai/loadable";
import type { TtsProviderId } from "@/lib/settings/types";
import { keyringStorage } from "@/lib/storage/keyring-storage";

type ApiKeyStorageKey =
  | ProviderStorageKey
  | "OPENAI_TTS_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "LMNT_API_KEY"
  | "HUME_API_KEY";

type ApiKeyId = ProviderId | `tts-${TtsProviderId}`;

const TTS_API_KEY_STORAGE_KEYS = {
  "tts-openai": "OPENAI_TTS_API_KEY",
  "tts-elevenlabs": "ELEVENLABS_API_KEY",
  "tts-lmnt": "LMNT_API_KEY",
  "tts-hume": "HUME_API_KEY",
} as const satisfies Record<`tts-${TtsProviderId}`, ApiKeyStorageKey>;

function createApiKeyAtoms(storageKey: ApiKeyStorageKey) {
  const baseAtom = atomWithStorage<string>(storageKey, "", keyringStorage, {
    getOnInit: true,
  });

  const unwrappedAtom = unwrap(baseAtom, (prev) => prev ?? "");
  const loadableAtom = loadable(baseAtom);

  return { atom: unwrappedAtom, loadableAtom, baseAtom };
}

export const apiKeyAtoms = Object.fromEntries([
  ...PROVIDER_REGISTRY.map((provider) => [provider.id, createApiKeyAtoms(provider.storageKey)]),
  ...Object.entries(TTS_API_KEY_STORAGE_KEYS).map(([id, storageKey]) => [
    id,
    createApiKeyAtoms(storageKey),
  ]),
]) as Record<ApiKeyId, ReturnType<typeof createApiKeyAtoms>>;

export function getApiKeyAtom(providerId: ApiKeyId) {
  return apiKeyAtoms[providerId].atom;
}

export const apiKeyAtomFamily = atomFamily((providerId: ApiKeyId) => apiKeyAtoms[providerId].atom);

export function getApiKeyLoadableAtom(providerId: ApiKeyId) {
  return apiKeyAtoms[providerId].loadableAtom;
}

export function getApiKeyBaseAtom(providerId: ApiKeyId) {
  return apiKeyAtoms[providerId].baseAtom;
}

export const apiKeysLoadingAtom = atom((get) => {
  return PROVIDER_REGISTRY.some((p) => get(apiKeyAtoms[p.id].loadableAtom).state === "loading");
});
