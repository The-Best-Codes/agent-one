import type { Atom } from "jotai";

import {
  analyticsIdentityAtom,
  chatSortAtom,
  chatVirtualizationModeAtom,
  chatVirtualizationThresholdAtom,
  collapsedSidebarLayoutAtom,
  colorThemeAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  extractReasoningEnabledAtom,
  fontAtom,
  inputStyleAtom,
  keyboardShortcutsEnabledInInputsAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  remendEnabledAtom,
  roundnessAtom,
  showChatStatusIndicatorAtom,
  showMessageActionRowAtom,
  showChatToBottomButtonAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
  systemPromptAppendixAtom,
  textScaleAtom,
  themeAtom,
  uiTintAtom,
  uiTintStrengthAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";

import { DEFAULT_SETTINGS } from "./types";
import * as types from "./types";

const inspectableSettingAtoms = {
  ANALYTICS_IDENTITY: analyticsIdentityAtom,
  CHAT_SORT: chatSortAtom,
  CHAT_VIRTUALIZATION_MODE: chatVirtualizationModeAtom,
  CHAT_VIRTUALIZATION_THRESHOLD: chatVirtualizationThresholdAtom,
  COLLAPSED_SIDEBAR_LAYOUT: collapsedSidebarLayoutAtom,
  COLOR_THEME: colorThemeAtom,
  EXPERIMENTAL_THROTTLE_ENABLED: experimentalThrottleEnabledAtom,
  EXPERIMENTAL_THROTTLE_VALUE: experimentalThrottleValueAtom,
  EXTRACT_REASONING_ENABLED: extractReasoningEnabledAtom,
  FONT: fontAtom,
  INPUT_STYLE: inputStyleAtom,
  KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS: keyboardShortcutsEnabledInInputsAtom,
  MARKDOWN_HIGHLIGHTING: markdownHighlightingAtom,
  MARKDOWN_RENDERING: markdownRenderingAtom,
  MAX_CODEBLOCK_CHARS: maxCodeblockCharsAtom,
  MAX_MESSAGE_LENGTH: maxMessageLengthAtom,
  MAX_TOOL_RESULT_CHARS: maxToolResultCharsAtom,
  MCP_PARALLEL_LOAD_LIMIT: mcpParallelLoadLimitAtom,
  NOTIFICATION_SETTING: notificationSettingAtom,
  REGENERATE_ON_SAVE: regenerateOnSaveAtom,
  REMEND_ENABLED: remendEnabledAtom,
  ROUNDNESS: roundnessAtom,
  SHOW_CHAT_STATUS_INDICATOR: showChatStatusIndicatorAtom,
  SHOW_MESSAGE_ACTION_ROW: showMessageActionRowAtom,
  SHOW_CHAT_TO_BOTTOM_BUTTON: showChatToBottomButtonAtom,
  SMOOTH_STREAM_ENABLED: smoothStreamEnabledAtom,
  STOP_BUTTON_BEHAVIOR: stopButtonBehaviorAtom,
  SUBMIT_KEY: submitKeyAtom,
  SYSTEM_PROMPT_APPENDIX: systemPromptAppendixAtom,
  TEXT_SCALE: textScaleAtom,
  THEME: themeAtom,
  UI_TINT: uiTintAtom,
  UI_TINT_STRENGTH: uiTintStrengthAtom,
  USER_NAME: userNameAtom,
} satisfies Record<string, Atom<unknown>>;

type InspectableSettingKey = keyof typeof inspectableSettingAtoms;

function getSettingOptions(key: InspectableSettingKey): readonly unknown[] | undefined {
  return (types as unknown as Record<string, readonly unknown[] | undefined>)[`${key}_OPTIONS`];
}

export function isInspectableKey(key: string): key is InspectableSettingKey {
  return key in inspectableSettingAtoms;
}

export function getInspectableKeys(): string[] {
  return Object.keys(inspectableSettingAtoms);
}

export interface SettingMetadata {
  key: string;
  type: string;
  options: readonly unknown[] | null;
  defaultValue: unknown;
}

export function getSettingMetadata(key: string): SettingMetadata | null {
  if (!isInspectableKey(key)) {
    return null;
  }

  const defaultValue = DEFAULT_SETTINGS[key];
  const options = getSettingOptions(key);

  return {
    key,
    type: options ? "enum" : typeof defaultValue,
    options: options || (typeof defaultValue === "boolean" ? [true, false] : null),
    defaultValue,
  };
}

export function getSettingAtom(key: string) {
  return isInspectableKey(key) ? inspectableSettingAtoms[key] : null;
}

export function validateSettingValue(
  key: string,
  value: unknown,
): { success: boolean; error?: string } {
  const metadata = getSettingMetadata(key);
  if (!metadata) {
    return { success: false, error: `Invalid or non-inspectable setting key: "${key}"` };
  }

  if (metadata.options) {
    if (!metadata.options.includes(value)) {
      return {
        success: false,
        error: `Value ${JSON.stringify(value)} is not a valid option. Valid options are: ${metadata.options.map((option) => JSON.stringify(option)).join(", ")}`,
      };
    }
    return { success: true };
  }

  const expectedType = typeof metadata.defaultValue;
  if (typeof value !== expectedType) {
    return {
      success: false,
      error: `Expected type ${expectedType}, but received ${typeof value}`,
    };
  }

  return { success: true };
}
