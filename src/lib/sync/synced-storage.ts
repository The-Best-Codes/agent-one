import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

import { authClient, SERVER_URL } from "../auth/auth-client";
import {
  clearSyncTokenValue,
  getSyncToken,
  setSyncTokenValue,
} from "../auth/sync-token";
import { getLogger } from "../logger";
import { debounce } from "../utils";

const logger = getLogger(import.meta.url);

const SYNC_ENDPOINT = `${SERVER_URL}/api/sync/settings`;
const LOCAL_UPDATED_AT_KEY = "agent-one-settings-sync-updated-at";
const PUSH_DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 60_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

const syncedKeys = new Set<string>();
const pulledKeys = new Set<string>();

function collectSettings(): Record<string, unknown> {
  const blob: Record<string, unknown> = {};
  for (const key of syncedKeys) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        blob[key] = JSON.parse(raw);
      } catch {
        blob[key] = raw;
      }
    }
  }
  return blob;
}

async function push(): Promise<void> {
  const token = getSyncToken();
  if (!token) return;

  try {
    const settings = collectSettings();
    const { data, error } = await authClient.$fetch<{
      updatedAt: string | null;
    }>(SYNC_ENDPOINT, {
      method: "PUT",
      body: { settings },
      auth: { type: "Bearer", token },
    });

    if (error) {
      logger.warn("sync push failed:", error);
      return;
    }

    if (data?.updatedAt) {
      localStorage.setItem(LOCAL_UPDATED_AT_KEY, data.updatedAt);
    }
  } catch (err) {
    logger.warn("sync push error:", err);
  }
}

const debouncedPush = debounce(() => void push(), PUSH_DEBOUNCE_MS);

window.addEventListener("beforeunload", () => {
  if (debouncedPush.pending()) {
    debouncedPush.cancel();
    void push();
  }
});

async function pull(): Promise<void> {
  const token = getSyncToken();
  if (!token) return;

  try {
    const { data, error } = await authClient.$fetch<{
      settings: Record<string, unknown>;
      updatedAt: string | null;
    }>(SYNC_ENDPOINT, {
      auth: { type: "Bearer", token },
    });

    if (error) {
      logger.warn("sync pull failed:", error);
      return;
    }

    if (!data?.updatedAt) return;

    const localUpdatedAt = localStorage.getItem(LOCAL_UPDATED_AT_KEY);
    if (
      localUpdatedAt &&
      new Date(localUpdatedAt) >= new Date(data.updatedAt)
    ) {
      return;
    }

    for (const [key, value] of Object.entries(data.settings)) {
      const serialized = JSON.stringify(value);
      const current = localStorage.getItem(key);
      if (current === serialized) continue;

      pulledKeys.add(key);
      localStorage.setItem(key, serialized);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: serialized,
          oldValue: current,
          storageArea: localStorage,
        }),
      );
      pulledKeys.delete(key);
    }

    localStorage.setItem(LOCAL_UPDATED_AT_KEY, data.updatedAt);
  } catch (err) {
    logger.warn("sync pull error:", err);
  }
}

export function setSyncToken(token: string): void {
  setSyncTokenValue(token);
  void pull();
  if (!pollTimer) {
    pollTimer = setInterval(() => void pull(), POLL_INTERVAL_MS);
  }
}

export function clearSyncToken(): void {
  if (debouncedPush.pending()) {
    debouncedPush.cancel();
    if (getSyncToken()) void push();
  }
  clearSyncTokenValue();
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  localStorage.removeItem(LOCAL_UPDATED_AT_KEY);
}

export function createSyncedStorage<T>(): SyncStorage<T> {
  return {
    getItem(key: string, initialValue: T): T {
      const raw = localStorage.getItem(key);
      if (raw === null) return initialValue;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return initialValue;
      }
    },

    setItem(key: string, newValue: T): void {
      syncedKeys.add(key);
      localStorage.setItem(key, JSON.stringify(newValue));
      if (!pulledKeys.has(key)) {
        debouncedPush();
      }
    },

    removeItem(key: string): void {
      syncedKeys.delete(key);
      localStorage.removeItem(key);
      if (!pulledKeys.has(key)) {
        debouncedPush();
      }
    },

    subscribe(key: string, callback: (value: T) => void): () => void {
      syncedKeys.add(key);

      const handler = (e: StorageEvent) => {
        if (e.key === key && e.newValue !== null) {
          try {
            callback(JSON.parse(e.newValue) as T);
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener("storage", handler);

      return () => {
        window.removeEventListener("storage", handler);
      };
    },
  };
}
