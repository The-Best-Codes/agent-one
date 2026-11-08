import { atom, type Atom, type Getter } from "jotai";
import { atomWithStorage, unwrap } from "jotai/utils";

import { loadable } from "@/lib/jotai/loadable";
import { keyringStorage } from "@/lib/storage/keyring-storage";

const STORAGE_KEY = "agent-one-custom-provider-api-keys";

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

function readStoredKeys(get: Getter): CustomProviderApiKeys | Promise<CustomProviderApiKeys> {
  const stored = get(baseAtom);
  return stored instanceof Promise ? stored.then(() => get(baseAtom)) : stored;
}

export const setCustomProviderApiKeyAtom = atom(
  null,
  async (get, set, providerId: string, apiKey: string) => {
    const stored = readStoredKeys(get);
    const current = stored instanceof Promise ? await stored : stored;
    await set(baseAtom, { ...current, [providerId]: apiKey });
  },
);

export const deleteCustomProviderApiKeyAtom = atom(null, async (get, set, providerId: string) => {
  const stored = readStoredKeys(get);
  const current = stored instanceof Promise ? await stored : stored;
  const { [providerId]: _removed, ...rest } = current;
  void _removed;
  await set(baseAtom, rest);
});
