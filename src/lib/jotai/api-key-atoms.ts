import { atom, getDefaultStore } from "jotai";
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
import { encryptedSyncManager } from "@/lib/sync/encrypted-sync-manager";

type ApiKeyStorageKey =
  | ProviderStorageKey
  | "OPENAI_TTS_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "HUME_API_KEY"
  | "GOOGLE_GENERATIVE_AI_TTS_API_KEY";

type ApiKeyId = ProviderId | `tts-${TtsProviderId}`;

const TTS_API_KEY_STORAGE_KEYS = {
  "tts-openai": "OPENAI_TTS_API_KEY",
  "tts-elevenlabs": "ELEVENLABS_API_KEY",
  "tts-hume": "HUME_API_KEY",
  "tts-google": "GOOGLE_GENERATIVE_AI_TTS_API_KEY",
} as const satisfies Record<`tts-${TtsProviderId}`, ApiKeyStorageKey>;

const API_KEY_SYNC_PREFIX = "apiKey:";
const UNSYNCED_API_KEYS = new Set<ApiKeyStorageKey>(["AGENT_ONE_API_KEY"]);

function syncedKeyringStorage(storageKey: ApiKeyStorageKey): typeof keyringStorage {
  if (UNSYNCED_API_KEYS.has(storageKey)) return keyringStorage;

  const name = `${API_KEY_SYNC_PREFIX}${storageKey}`;
  return {
    ...keyringStorage,
    setItem: async (key, value) => {
      await keyringStorage.setItem(key, value);
      encryptedSyncManager.markDirty(name);
    },
    removeItem: async (key) => {
      await keyringStorage.removeItem(key);
      encryptedSyncManager.markDirty(name);
    },
  };
}

function createApiKeyAtoms(storageKey: ApiKeyStorageKey) {
  const baseAtom = atomWithStorage<string>(storageKey, "", syncedKeyringStorage(storageKey), {
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

const syncedApiKeyAtoms = new Map(
  [
    ...PROVIDER_REGISTRY.map(
      (provider) => [provider.storageKey, apiKeyAtoms[provider.id]] as const,
    ),
    ...Object.entries(TTS_API_KEY_STORAGE_KEYS).map(
      ([id, storageKey]) => [storageKey, apiKeyAtoms[id as ApiKeyId]] as const,
    ),
  ].filter(([storageKey]) => !UNSYNCED_API_KEYS.has(storageKey)),
);

encryptedSyncManager.registerSource({
  prefix: API_KEY_SYNC_PREFIX,
  readAll: async () => {
    const store = getDefaultStore();
    const entries = await Promise.all(
      [...syncedApiKeyAtoms].map(
        async ([storageKey, atoms]) => [storageKey, await store.get(atoms.baseAtom)] as const,
      ),
    );
    return Object.fromEntries(entries);
  },
  write: async (storageKey, value) => {
    const atoms = syncedApiKeyAtoms.get(storageKey as ApiKeyStorageKey);
    if (atoms) await getDefaultStore().set(atoms.baseAtom, value);
  },
});
