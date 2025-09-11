export type MarkdownRenderingOption = "user" | "assistant" | "both" | "neither";

export interface SettingValue<T> {
  value: T;
  set: (value: T) => void;
}

export interface SettingsType {
  MARKDOWN_HIGHLIGHTING: SettingValue<boolean>;
  MARKDOWN_RENDERING: SettingValue<MarkdownRenderingOption>;
}

export const DEFAULT_SETTINGS = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
};
