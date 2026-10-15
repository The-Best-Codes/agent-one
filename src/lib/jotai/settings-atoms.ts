import { atom, getDefaultStore, type WritableAtom } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";

import {
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  type SettingKey,
  type SettingValue,
} from "@/lib/settings/definitions";
import { settingsSyncManager } from "@/lib/sync/settings-sync-manager";

export const SETTING_PREFIX = "agent-one-setting-";

export type SettingAtom<T> = WritableAtom<T, [T | typeof RESET | ((prev: T) => T)], void>;

function createSettingAtom<T>(key: SettingKey, defaultValue: T): SettingAtom<T> {
  const baseAtom = atomWithStorage<T>(`${SETTING_PREFIX}${key}`, defaultValue, undefined, {
    getOnInit: true,
  });

  settingsSyncManager.registerAtomSetter(key, (value: unknown) => {
    getDefaultStore().set(baseAtom, value as T);
  });

  return atom(
    (get) => get(baseAtom),
    (get, set, update) => {
      set(
        baseAtom,
        typeof update === "function" ? (update as (prev: T) => T)(get(baseAtom)) : update,
      );
      settingsSyncManager.markDirty(key);
    },
  );
}

export const settingAtoms = Object.fromEntries(
  SETTING_KEYS.map((key) => [key, createSettingAtom(key, DEFAULT_SETTINGS[key])]),
) as { [K in SettingKey]: SettingAtom<SettingValue<K>> };
