export type MarkdownRenderingOption = "user" | "assistant" | "both" | "neither";
export type SubmitKeyOption = "enter" | "ctrl-enter";

export interface SettingValue<T> {
  value: T;
  set: (value: T) => void;
}

export interface SettingsType {
  MARKDOWN_HIGHLIGHTING: SettingValue<boolean>;
  MARKDOWN_RENDERING: SettingValue<MarkdownRenderingOption>;
  SUBMIT_KEY: SettingValue<SubmitKeyOption>;
  MAX_CODEBLOCK_CHARS: SettingValue<number>;
  MAX_MESSAGE_LENGTH: SettingValue<number>;
  EXPERIMENTAL_THROTTLE_ENABLED: SettingValue<boolean>;
  EXPERIMENTAL_THROTTLE_VALUE: SettingValue<number>;
  SMOOTH_STREAM_ENABLED: SettingValue<boolean>;
  REGENERATE_ON_SAVE: SettingValue<boolean>;
}

export const DEFAULT_SETTINGS = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
  SUBMIT_KEY: "enter",
  MAX_CODEBLOCK_CHARS: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  EXPERIMENTAL_THROTTLE_ENABLED: true,
  EXPERIMENTAL_THROTTLE_VALUE: 250,
  SMOOTH_STREAM_ENABLED: false,
  REGENERATE_ON_SAVE: false,
};
