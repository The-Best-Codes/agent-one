export interface SettingValue<T> {
  value: T;
  set: (value: T) => void;
}

export interface SettingsType {
  MARKDOWN_HIGHLIGHTING: SettingValue<boolean>;
}

export const DEFAULT_SETTINGS = {
  MARKDOWN_HIGHLIGHTING: true,
};
