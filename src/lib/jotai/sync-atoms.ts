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

export type ChatSyncMode = "off" | "all" | "selected";

export const chatSyncModeAtom = atomWithStorage<ChatSyncMode>(
  "agent-one-chat-sync-mode",
  "off",
  undefined,
  { getOnInit: true },
);

export const chatSyncEnabledAtom = atom((get) => get(chatSyncModeAtom) !== "off");

export const chatSyncAvailableAtom = atom(false);

export const chatSyncExcludedIdsAtom = atom<ReadonlySet<string>>(new Set<string>());

export const chatSyncDownloadingIdsAtom = atom<ReadonlySet<string>>(new Set<string>());

export type ChatSyncPhase = "off" | "idle" | "syncing" | "waiting" | "error" | "quota";

export interface ChatSyncStatus {
  phase: ChatSyncPhase;
  pendingUploads: number;
  pendingDownloads: number;
  tooLarge: number;
  totalChats: number;
  syncedChats: number;
  lastSyncedAt: number | null;
  error: string | null;
}

export const chatSyncStatusAtom = atom<ChatSyncStatus>({
  phase: "off",
  pendingUploads: 0,
  pendingDownloads: 0,
  tooLarge: 0,
  totalChats: 0,
  syncedChats: 0,
  lastSyncedAt: null,
  error: null,
});

export const deviceNameAtom = atomWithStorage("agent-one-device-name", "", undefined, {
  getOnInit: true,
});

export const defaultDeviceNameAtom = atom("This device");
