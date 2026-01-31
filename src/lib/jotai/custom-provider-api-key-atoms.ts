import { atom } from "jotai";
import { atomWithStorage, loadable, unwrap } from "jotai/utils";

import { keyringStorage } from "@/lib/storage/keyring-storage";

const STORAGE_KEY = "agent-one-custom-provider-api-keys";

type CustomProviderApiKeys = Record<string, string>;

const baseAtom = atomWithStorage<CustomProviderApiKeys>(
  STORAGE_KEY,
  {},
  keyringStorage,
  { getOnInit: true },
);

export const customProviderApiKeysAtom = unwrap(baseAtom, (prev) => prev ?? {});
export const customProviderApiKeysLoadableAtom = loadable(baseAtom);

export const setCustomProviderApiKeyAtom = atom(
  null,
  async (get, set, providerId: string, apiKey: string) => {
    const current = get(customProviderApiKeysAtom);
    await set(baseAtom, { ...current, [providerId]: apiKey });
  },
);

export const deleteCustomProviderApiKeyAtom = atom(
  null,
  async (get, set, providerId: string) => {
    const current = get(customProviderApiKeysAtom);
    const { [providerId]: _removed, ...rest } = current;
    void _removed;
    await set(baseAtom, rest);
  },
);
