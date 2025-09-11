export interface SettingValue<T> {
  value: T;
  set: (value: T) => void;
}

export interface SettingsType {
  APP_LANGUAGE: SettingValue<string>;
  THEME_MODE: SettingValue<"light" | "dark" | "system">;
  AUTO_SAVE: SettingValue<boolean>;
}

export const DEFAULT_SETTINGS = {
  APP_LANGUAGE: "en",
  THEME_MODE: "system" as const,
  AUTO_SAVE: true,
};
