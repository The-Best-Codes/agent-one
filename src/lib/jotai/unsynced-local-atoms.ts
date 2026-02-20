import { atomWithStorage, createJSONStorage } from "jotai/utils";

function createNoSyncStorage<T>() {
  const storage = createJSONStorage<T>(() => localStorage);
  delete storage.subscribe;
  return storage;
}

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  false,
  createNoSyncStorage<boolean>(),
  { getOnInit: true },
);

export const activeSettingsSectionAtom = atomWithStorage(
  "agent-one-active-settings-section",
  "account",
  createNoSyncStorage<string>(),
  { getOnInit: true },
);
