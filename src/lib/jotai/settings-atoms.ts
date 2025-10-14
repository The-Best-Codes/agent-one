import { atomWithStorage } from "jotai/utils";

import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type RoundnessOption,
  type SubmitKeyOption,
  type ThemeOption,
} from "@/lib/settings/types";

import { lsStringOrUndefined } from "./load-from-localstorage";

const SETTING_PREFIX = "agent-one-setting-";

const parseValue = <T>(value: string | undefined, defaultValue: T): T => {
  if (value === undefined) return defaultValue;
  if (typeof defaultValue === "boolean") {
    return (value === "true") as T;
  } else if (typeof defaultValue === "number") {
    return (Number(value) || defaultValue) as T;
  } else {
    return value as T;
  }
};

const createSettingAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  const lsKey = `${SETTING_PREFIX}${key}`;
  return atomWithStorage<T>(
    lsKey,
    parseValue(lsStringOrUndefined(lsKey), defaultValue),
  );
};

export const markdownHighlightingAtom = createSettingAtom(
  "MARKDOWN_HIGHLIGHTING",
  DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING,
);

export const markdownRenderingAtom = createSettingAtom<MarkdownRenderingOption>(
  "MARKDOWN_RENDERING",
  DEFAULT_SETTINGS.MARKDOWN_RENDERING,
);

export const submitKeyAtom = createSettingAtom<SubmitKeyOption>(
  "SUBMIT_KEY",
  DEFAULT_SETTINGS.SUBMIT_KEY,
);

export const maxCodeblockCharsAtom = createSettingAtom(
  "MAX_CODEBLOCK_CHARS",
  DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS,
);

export const maxMessageLengthAtom = createSettingAtom(
  "MAX_MESSAGE_LENGTH",
  DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH,
);

export const experimentalThrottleEnabledAtom = createSettingAtom(
  "EXPERIMENTAL_THROTTLE_ENABLED",
  DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED,
);

export const experimentalThrottleValueAtom = createSettingAtom(
  "EXPERIMENTAL_THROTTLE_VALUE",
  DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE,
);

export const smoothStreamEnabledAtom = createSettingAtom(
  "SMOOTH_STREAM_ENABLED",
  DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED,
);

export const regenerateOnSaveAtom = createSettingAtom(
  "REGENERATE_ON_SAVE",
  DEFAULT_SETTINGS.REGENERATE_ON_SAVE,
);

export const themeAtom = createSettingAtom<ThemeOption>(
  "THEME",
  DEFAULT_SETTINGS.THEME,
);

export const roundnessAtom = createSettingAtom<RoundnessOption>(
  "ROUNDNESS",
  DEFAULT_SETTINGS.ROUNDNESS,
);
