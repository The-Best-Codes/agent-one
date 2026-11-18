import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const syncEnabledAtom = atomWithStorage("agent-one-sync-enabled", true, undefined, {
  getOnInit: true,
});

export const encryptedSyncEnabledAtom = atomWithStorage(
  "agent-one-encrypted-sync-enabled",
  false,
  undefined,
  { getOnInit: true },
);

export type EncryptedSyncStatus = "off" | "locked" | "unlocked";

export const encryptedSyncStatusAtom = atom<EncryptedSyncStatus>("off");
