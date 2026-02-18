import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";

import { SERVER_URL } from "../auth/auth-client";
import { getLogger } from "../logger";

const logger = getLogger(import.meta.url);

const SYNC_ENDPOINT = `${SERVER_URL}/api/sync/settings`;
const LOCAL_UPDATED_AT_KEY = "agent-one-settings-sync-updated-at";
const PUSH_DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 60_000;

let authToken: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const syncedKeys = new Set<string>();
const pulledKeys = new Set<string>();

function fetchWithAuth(
  url: string,
  token: string,
  options?: RequestInit,
): Promise<Response> {
  return tauriFetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

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
  if (!authToken) return;

  try {
    const settings = collectSettings();
    const res = await fetchWithAuth(SYNC_ENDPOINT, authToken, {
      method: "PUT",
      body: JSON.stringify({ settings }),
    });

    if (!res.ok) {
      logger.warn(`sync push failed: ${res.status}`);
      return;
    }

    const data = (await res.json()) as { updatedAt: string | null };
    if (data.updatedAt) {
      localStorage.setItem(LOCAL_UPDATED_AT_KEY, data.updatedAt);
    }
  } catch (err) {
    logger.warn("sync push error:", err);
  }
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void push();
  }, PUSH_DEBOUNCE_MS);
}

window.addEventListener("beforeunload", () => {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
    void push();
  }
});

async function pull(): Promise<void> {
  if (!authToken) return;

  try {
    const res = await fetchWithAuth(SYNC_ENDPOINT, authToken);
    if (!res.ok) {
      logger.warn(`sync pull failed: ${res.status}`);
      return;
    }

    const data = (await res.json()) as {
      settings: Record<string, unknown>;
      updatedAt: string | null;
    };

    if (!data.updatedAt) return;

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

export function setAuthToken(token: string): void {
  authToken = token;
  void pull();
  if (!pollTimer) {
    pollTimer = setInterval(() => void pull(), POLL_INTERVAL_MS);
  }
}

export function clearAuthToken(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
    if (authToken) void push();
  }
  authToken = null;
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
        schedulePush();
      }
    },

    removeItem(key: string): void {
      syncedKeys.delete(key);
      localStorage.removeItem(key);
      if (!pulledKeys.has(key)) {
        schedulePush();
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
