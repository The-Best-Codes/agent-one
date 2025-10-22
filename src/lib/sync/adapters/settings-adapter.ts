import type { SyncAdapterConfig } from "../core/types";
import { createAdapter } from "./create-adapter";

export interface SettingsSyncPayload {
  settingsKey: string;
  value: unknown;
}

export interface SettingsContext {
  setSetting: (key: string, value: unknown) => void;
  getSetting: (key: string) => unknown;
}

export function createSettingsAdapter(): ReturnType<
  typeof createAdapter<SettingsSyncPayload, SettingsContext>
> {
  const config: SyncAdapterConfig<SettingsSyncPayload, SettingsContext> = {
    entityType: "settings",
    selector: () => {
      return {
        settingsKey: "",
        value: null,
      };
    },
    onRemoteChange: async (payload, settingsContext) => {
      if (payload.settingsKey) {
        settingsContext.setSetting(payload.settingsKey, payload.value);
      }
    },
    conflictResolution: "last-write-wins",
  };

  return createAdapter(config);
}
