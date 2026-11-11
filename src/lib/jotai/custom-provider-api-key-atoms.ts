import { atom, getDefaultStore, type Atom } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";

import { loadable } from "@/lib/jotai/loadable";
import { keyringStorage } from "@/lib/storage/keyring-storage";
import { encryptedSyncManager } from "@/lib/sync/encrypted-sync-manager";

// TODO: sync the custom providers themselves (base URL, models, etc.); until then their synced API keys are useless on other devices
const STORAGE_KEY = "agent-one-custom-provider-api-keys";
const SYNC_PREFIX = "customProviderKey:";

type CustomProviderApiKeys = Record<string, string>;

const baseAtom = atomWithStorage<CustomProviderApiKeys>(STORAGE_KEY, {}, keyringStorage, {
  getOnInit: true,
});

export const customProviderApiKeysAtom = unwrap(baseAtom, (prev) => prev ?? {});
export const customProviderApiKeysLoadableAtom = loadable(baseAtom);

const customProviderApiKeyAtomCache = new Map<string, Atom<string>>();

export function getCustomProviderApiKeyAtom(providerId: string) {
  const cachedAtom = customProviderApiKeyAtomCache.get(providerId);
  if (cachedAtom) {
    return cachedAtom;
  }

  const apiKeyAtom = atom((get) => get(customProviderApiKeysAtom)[providerId] ?? "");

  customProviderApiKeyAtomCache.set(providerId, apiKeyAtom);
  return apiKeyAtom;
}

export const setCustomProviderApiKeyAtom = atom(
  null,
  async (get, set, providerId: string, apiKey: string) => {
    const current = get(customProviderApiKeysAtom);
    await set(baseAtom, { ...current, [providerId]: apiKey });
    encryptedSyncManager.markDirty(`${SYNC_PREFIX}${providerId}`);
  },
);

export const deleteCustomProviderApiKeyAtom = atom(null, async (get, set, providerId: string) => {
  const current = get(customProviderApiKeysAtom);
  const { [providerId]: _removed, ...rest } = current;
  void _removed;
  await set(baseAtom, rest);
  encryptedSyncManager.markDirty(`${SYNC_PREFIX}${providerId}`);
});

encryptedSyncManager.registerSource({
  prefix: SYNC_PREFIX,
  readAll: async () => getDefaultStore().get(baseAtom),
  write: async (providerId, apiKey) => {
    const store = getDefaultStore();
    const { [providerId]: _removed, ...rest } = await store.get(baseAtom);
    void _removed;
    await store.set(baseAtom, apiKey ? { ...rest, [providerId]: apiKey } : rest);
  },
});
