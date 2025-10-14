import { getDefaultStore } from "jotai";

import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  regenerateOnSaveAtom,
  smoothStreamEnabledAtom,
  submitKeyAtom,
} from "../jotai/settings-atoms";
import {
  DEFAULT_SETTINGS,
  type DefaultSettings,
  type MarkdownRenderingOption,
  type SubmitKeyOption,
} from "./types";

/**
 * Resets all settings to their default values.
 * This function updates all Jotai atoms to their default values.
 */
export function resetAllSettings(): void {
  const store = getDefaultStore();

  store.set(markdownHighlightingAtom, DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING);
  store.set(
    markdownRenderingAtom,
    DEFAULT_SETTINGS.MARKDOWN_RENDERING as MarkdownRenderingOption,
  );
  store.set(submitKeyAtom, DEFAULT_SETTINGS.SUBMIT_KEY as SubmitKeyOption);
  store.set(maxCodeblockCharsAtom, DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS);
  store.set(maxMessageLengthAtom, DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH);
  store.set(
    experimentalThrottleEnabledAtom,
    DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED,
  );
  store.set(
    experimentalThrottleValueAtom,
    DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE,
  );
  store.set(smoothStreamEnabledAtom, DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED);
  store.set(regenerateOnSaveAtom, DEFAULT_SETTINGS.REGENERATE_ON_SAVE);
}

/**
 * Resets a specific setting to its default value.
 * @param key - The key of the setting to reset
 */
export function resetSetting(key: keyof DefaultSettings): void {
  const store = getDefaultStore();
  const defaultValue = DEFAULT_SETTINGS[key];

  switch (key) {
    case "MARKDOWN_HIGHLIGHTING":
      store.set(markdownHighlightingAtom, defaultValue as boolean);
      break;
    case "MARKDOWN_RENDERING":
      store.set(markdownRenderingAtom, defaultValue as MarkdownRenderingOption);
      break;
    case "SUBMIT_KEY":
      store.set(submitKeyAtom, defaultValue as SubmitKeyOption);
      break;
    case "MAX_CODEBLOCK_CHARS":
      store.set(maxCodeblockCharsAtom, defaultValue as number);
      break;
    case "MAX_MESSAGE_LENGTH":
      store.set(maxMessageLengthAtom, defaultValue as number);
      break;
    case "EXPERIMENTAL_THROTTLE_ENABLED":
      store.set(experimentalThrottleEnabledAtom, defaultValue as boolean);
      break;
    case "EXPERIMENTAL_THROTTLE_VALUE":
      store.set(experimentalThrottleValueAtom, defaultValue as number);
      break;
    case "SMOOTH_STREAM_ENABLED":
      store.set(smoothStreamEnabledAtom, defaultValue as boolean);
      break;
    case "REGENERATE_ON_SAVE":
      store.set(regenerateOnSaveAtom, defaultValue as boolean);
      break;
  }
}
