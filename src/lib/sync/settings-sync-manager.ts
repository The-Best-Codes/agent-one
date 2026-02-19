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
    // corrupt data, start fresh
  }
  return {};
}

function saveTimestamps(timestamps: TimestampMap): void {
  try {
    localStorage.setItem(TIMESTAMPS_LS_KEY, JSON.stringify(timestamps));
  } catch {
    // storage full or unavailable
  }
}

function readLocalSetting(key: SettingKey): unknown | undefined {
  try {
    const raw = localStorage.getItem(`${SETTING_PREFIX}${key}`);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // corrupt data
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
  }

  registerAtomSetter(key: SettingKey, setter: (value: unknown) => void): void {
    this.atomSetters.set(key, setter);
  }

  markDirty(key: SettingKey): void {
    const now = Date.now();
    this.timestamps[key] = now;
    saveTimestamps(this.timestamps);

    this.dirtyKeys.add(key);
    this.schedulePush();
  }

  private schedulePush(): void {
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null;
      void this.push();
    }, DEBOUNCE_MS);
  }

  private async push(): Promise<void> {
    if (this.dirtyKeys.size === 0) return;

    const keys = [...this.dirtyKeys];
    this.dirtyKeys.clear();

    const payload: ServerSettings = {};
    for (const key of keys) {
      const value = readLocalSetting(key);
      const updatedAt = this.timestamps[key];
      if (value !== undefined && updatedAt !== undefined) {
        payload[key] = { value, updatedAt };
      }
    }

    if (Object.keys(payload).length === 0) return;

    try {
      await authClient.$fetch(`${SERVER_URL}/api/sync/settings`, {
        method: "PUT",
        body: { settings: payload },
      });
    } catch (error) {
      logger.warn("Failed to push settings to server:", error);
      for (const key of keys) this.dirtyKeys.add(key);
      this.schedulePush();
    }
  }

  async pull(): Promise<void> {
    if (this.pullPromise) return this.pullPromise;
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
      if (!serverSettings || typeof serverSettings !== "object") return;

      for (const [key, rawEntry] of Object.entries(serverSettings)) {
        const entry = rawEntry as SettingEntry;
        const settingKey = key as SettingKey;
        const serverTime = entry.updatedAt;
        const localTime = this.timestamps[settingKey];

        if (localTime === undefined || serverTime > localTime) {
          const setter = this.atomSetters.get(settingKey);
          if (setter) setter(entry.value);

          this.timestamps[settingKey] = serverTime;
        }
      }

      saveTimestamps(this.timestamps);
    } catch (error) {
      logger.warn("Failed to pull settings from server:", error);
    }
  }
}

export const settingsSyncManager = new SettingsSyncManager();
