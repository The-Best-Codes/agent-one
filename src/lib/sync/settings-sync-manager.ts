import { authClient, SERVER_URL } from "@/lib/auth/auth-client";
import { getLogger } from "@/lib/logger";
import type { DefaultSettings } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

const TIMESTAMPS_LS_KEY = "agent-one-setting-timestamps";
const SETTING_PREFIX = "agent-one-setting-";
const DEBOUNCE_MS = 2000;

type SettingKey = keyof DefaultSettings;
type TimestampMap = Partial<Record<SettingKey, number>>;
type SettingEntry = { value: unknown; updatedAt: number };
type ServerSettings = Record<string, SettingEntry>;

function loadTimestamps(): TimestampMap {
  try {
    const raw = localStorage.getItem(TIMESTAMPS_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    logger.verbose("Timestamps in localStorage were corrupt, starting fresh");
  }
  return {};
}

function saveTimestamps(timestamps: TimestampMap): void {
  try {
    localStorage.setItem(TIMESTAMPS_LS_KEY, JSON.stringify(timestamps));
  } catch {
    logger.warn("Failed to save timestamps to localStorage");
  }
}

function readLocalSetting(key: SettingKey): unknown | undefined {
  try {
    const raw = localStorage.getItem(`${SETTING_PREFIX}${key}`);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    logger.verbose("Failed to read setting %s from localStorage", key);
  }
  return undefined;
}

class SettingsSyncManager {
  private timestamps: TimestampMap;
  private dirtyKeys: Set<SettingKey> = new Set();
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pullPromise: Promise<void> | null = null;
  private atomSetters = new Map<SettingKey, (value: unknown) => void>();

  constructor() {
    this.timestamps = loadTimestamps();
    const keyCount = Object.keys(this.timestamps).length;
    logger.verbose(
      "SettingsSyncManager initialized with %d tracked timestamps",
      keyCount,
    );
  }

  registerAtomSetter(key: SettingKey, setter: (value: unknown) => void): void {
    this.atomSetters.set(key, setter);
    logger.verbose("Registered atom setter for key: %s", key);
  }

  markDirty(key: SettingKey): void {
    const now = Date.now();
    this.timestamps[key] = now;
    saveTimestamps(this.timestamps);

    this.dirtyKeys.add(key);
    logger.verbose(
      "Marked key dirty: %s (timestamp: %d, total dirty: %d)",
      key,
      now,
      this.dirtyKeys.size,
    );
    this.schedulePush();
  }

  private schedulePush(): void {
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      logger.verbose("Reset push debounce timer (%dms)", DEBOUNCE_MS);
    } else {
      logger.verbose("Scheduled push in %dms", DEBOUNCE_MS);
    }
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.push();
    }, DEBOUNCE_MS);
  }

  private async push(): Promise<void> {
    if (this.dirtyKeys.size === 0) {
      logger.verbose("Push called but no dirty keys, skipping");
      return;
    }

    const keys = [...this.dirtyKeys];
    this.dirtyKeys.clear();
    logger.verbose("Pushing %d dirty keys to server: %s", keys.length, keys);

    const payload: ServerSettings = {};
    for (const key of keys) {
      const value = readLocalSetting(key);
      const updatedAt = this.timestamps[key];
      if (value !== undefined && updatedAt !== undefined) {
        payload[key] = { value, updatedAt };
      }
    }

    const payloadKeyCount = Object.keys(payload).length;
    if (payloadKeyCount === 0) {
      logger.verbose("No valid payload entries after reading localStorage");
      return;
    }

    try {
      logger.verbose(
        "Sending PUT to /api/sync/settings with %d keys",
        payloadKeyCount,
      );
      await authClient.$fetch(`${SERVER_URL}/api/sync/settings`, {
        method: "PUT",
        body: { settings: payload },
      });
      logger.verbose("Push succeeded for %d keys", payloadKeyCount);
    } catch (error) {
      logger.warn("Failed to push settings to server:", error);
      for (const key of keys) this.dirtyKeys.add(key);
      logger.verbose(
        "Re-queued %d keys for retry, scheduling another push",
        keys.length,
      );
      this.schedulePush();
    }
  }

  async pull(): Promise<void> {
    if (this.pullPromise) {
      logger.verbose("Pull already in progress, deduplicating");
      return this.pullPromise;
    }
    logger.verbose("Starting settings pull from server");
    this.pullPromise = this.doPull();
    try {
      await this.pullPromise;
    } finally {
      this.pullPromise = null;
    }
  }

  private async doPull(): Promise<void> {
    try {
      const response = await authClient.$fetch(
        `${SERVER_URL}/api/sync/settings`,
        { method: "GET" },
      );

      const body = response.data as { settings?: ServerSettings } | null;
      const serverSettings = body?.settings;
      if (!serverSettings || typeof serverSettings !== "object") {
        logger.verbose("Server returned no settings or empty response");
        return;
      }

      const serverKeys = Object.keys(serverSettings);
      logger.verbose(
        "Received %d settings from server: %s",
        serverKeys.length,
        serverKeys,
      );

      let appliedCount = 0;
      let skippedCount = 0;

      for (const [key, rawEntry] of Object.entries(serverSettings)) {
        const entry = rawEntry as SettingEntry;
        const settingKey = key as SettingKey;
        const serverTime = entry.updatedAt;
        const localTime = this.timestamps[settingKey];

        if (localTime === undefined || serverTime > localTime) {
          const setter = this.atomSetters.get(settingKey);
          if (setter) {
            setter(entry.value);
            logger.verbose(
              "Applied server value for %s (server: %d, local: %s)",
              settingKey,
              serverTime,
              localTime ?? "none",
            );
          } else {
            logger.verbose(
              "No atom setter registered for %s, skipping apply",
              settingKey,
            );
          }
          this.timestamps[settingKey] = serverTime;
          appliedCount++;
        } else {
          logger.verbose(
            "Kept local value for %s (local: %d >= server: %d)",
            settingKey,
            localTime,
            serverTime,
          );
          skippedCount++;
        }
      }

      saveTimestamps(this.timestamps);
      logger.verbose(
        "Pull complete: %d applied, %d skipped (local was newer)",
        appliedCount,
        skippedCount,
      );
    } catch (error) {
      logger.warn("Failed to pull settings from server:", error);
    }
  }
}

export const settingsSyncManager = new SettingsSyncManager();
