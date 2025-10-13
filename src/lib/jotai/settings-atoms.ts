import { atomWithStorage } from "jotai/utils";

import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type SubmitKeyOption,
} from "@/lib/settings/types";

import { lsStringOrUndefined } from "./load-from-localstorage";

const SETTING_PREFIX = "agent-one-setting-";

const createSettingAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  const lsKey = `${SETTING_PREFIX}${key}`;
  return atomWithStorage<T>(lsKey, lsStringOrUndefined(lsKey) ?? defaultValue);
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
