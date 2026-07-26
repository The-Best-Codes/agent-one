import { atom, getDefaultStore } from "jotai";
import { atomWithStorage, RESET } from "jotai/utils";

import type { KeyboardShortcutSettings } from "@/lib/kbd-registry";
import type { DefaultSettings } from "@/lib/settings/types";
import {
  type AnalyticsIdentityOption,
  type ChatBackgroundSettings,
  type ChatSortOption,
  type ColorThemeOption,
  DEFAULT_SETTINGS,
  type FontOption,
  type InputStyleOption,
  type MarkdownRenderingOption,
  type McpServerConfig,
  type MessageActionRowOption,
  type NotificationOption,
  type RoundnessOption,
  type StopButtonBehaviorOption,
  type SubmitKeyOption,
  type TtsSettings,
  type TextScaleOption,
  type ThemeOption,
  type TitleGenerationSettings,
  type UiTintOption,
  type UiTintStrengthOption,
  type CollapsedSidebarLayoutOption,
  type ToolConfigs,
  type ToolId,
} from "@/lib/settings/types";
import { settingsSyncManager } from "@/lib/sync/settings-sync-manager";

export const SETTING_PREFIX = "agent-one-setting-";

const createSettingAtom = <T>(key: keyof DefaultSettings, defaultValue: T) => {
  const lsKey = `${SETTING_PREFIX}${key}`;
  const baseAtom = atomWithStorage<T>(lsKey, defaultValue, undefined, {
    getOnInit: true,
  });

  type Update = T | typeof RESET | ((prev: T) => T);

  const syncedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: Update) => {
      if (update === RESET) {
        set(baseAtom, RESET);
      } else if (typeof update === "function") {
        set(baseAtom, (update as (prev: T) => T)(get(baseAtom)));
      } else {
        set(baseAtom, update);
      }
      settingsSyncManager.markDirty(key);
    },
  );

  settingsSyncManager.registerAtomSetter(key, (value: unknown) => {
    getDefaultStore().set(baseAtom, value as T);
  });

  return syncedAtom;
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

export const inputStyleAtom = createSettingAtom<InputStyleOption>(
  "INPUT_STYLE",
  DEFAULT_SETTINGS.INPUT_STYLE,
);

export const maxCodeblockCharsAtom = createSettingAtom(
  "MAX_CODEBLOCK_CHARS",
  DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS,
);

export const maxMessageLengthAtom = createSettingAtom(
  "MAX_MESSAGE_LENGTH",
  DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH,
);

export const maxToolResultCharsAtom = createSettingAtom(
  "MAX_TOOL_RESULT_CHARS",
  DEFAULT_SETTINGS.MAX_TOOL_RESULT_CHARS,
);

export const chatVirtualizationModeAtom = createSettingAtom(
  "CHAT_VIRTUALIZATION_MODE",
  DEFAULT_SETTINGS.CHAT_VIRTUALIZATION_MODE,
);

export const chatVirtualizationThresholdAtom = createSettingAtom(
  "CHAT_VIRTUALIZATION_THRESHOLD",
  DEFAULT_SETTINGS.CHAT_VIRTUALIZATION_THRESHOLD,
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

export const extractReasoningEnabledAtom = createSettingAtom(
  "EXTRACT_REASONING_ENABLED",
  DEFAULT_SETTINGS.EXTRACT_REASONING_ENABLED,
);

export const regenerateOnSaveAtom = createSettingAtom(
  "REGENERATE_ON_SAVE",
  DEFAULT_SETTINGS.REGENERATE_ON_SAVE,
);

export const stopButtonBehaviorAtom = createSettingAtom<StopButtonBehaviorOption>(
  "STOP_BUTTON_BEHAVIOR",
  DEFAULT_SETTINGS.STOP_BUTTON_BEHAVIOR,
);

export const showChatStatusIndicatorAtom = createSettingAtom(
  "SHOW_CHAT_STATUS_INDICATOR",
  DEFAULT_SETTINGS.SHOW_CHAT_STATUS_INDICATOR,
);

export const showMessagePreviewRailAtom = createSettingAtom(
  "SHOW_MESSAGE_PREVIEW_RAIL",
  DEFAULT_SETTINGS.SHOW_MESSAGE_PREVIEW_RAIL,
);

export const themeAtom = createSettingAtom<ThemeOption>("THEME", DEFAULT_SETTINGS.THEME);

export const colorThemeAtom = createSettingAtom<ColorThemeOption>(
  "COLOR_THEME",
  DEFAULT_SETTINGS.COLOR_THEME,
);

export const uiTintAtom = createSettingAtom<UiTintOption>("UI_TINT", DEFAULT_SETTINGS.UI_TINT);

export const uiTintStrengthAtom = createSettingAtom<UiTintStrengthOption>(
  "UI_TINT_STRENGTH",
  DEFAULT_SETTINGS.UI_TINT_STRENGTH,
);

export const roundnessAtom = createSettingAtom<RoundnessOption>(
  "ROUNDNESS",
  DEFAULT_SETTINGS.ROUNDNESS,
);

export const fontAtom = createSettingAtom<FontOption>("FONT", DEFAULT_SETTINGS.FONT);

export const textScaleAtom = createSettingAtom<TextScaleOption>(
  "TEXT_SCALE",
  DEFAULT_SETTINGS.TEXT_SCALE,
);

export const notificationSettingAtom = createSettingAtom<NotificationOption>(
  "NOTIFICATION_SETTING",
  DEFAULT_SETTINGS.NOTIFICATION_SETTING,
);

export const analyticsIdentityAtom = createSettingAtom<AnalyticsIdentityOption>(
  "ANALYTICS_IDENTITY",
  DEFAULT_SETTINGS.ANALYTICS_IDENTITY,
);

export const enabledToolsAtom = createSettingAtom<Record<ToolId, boolean>>(
  "ENABLED_TOOLS",
  DEFAULT_SETTINGS.ENABLED_TOOLS,
);

export const toolConfigsAtom = createSettingAtom<ToolConfigs>(
  "TOOL_CONFIGS",
  DEFAULT_SETTINGS.TOOL_CONFIGS,
);

export const mcpServersAtom = createSettingAtom<McpServerConfig[]>(
  "MCP_SERVERS",
  DEFAULT_SETTINGS.MCP_SERVERS,
);

export const mcpParallelLoadLimitAtom = createSettingAtom(
  "MCP_PARALLEL_LOAD_LIMIT",
  DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT,
);

export const userNameAtom = createSettingAtom("USER_NAME", DEFAULT_SETTINGS.USER_NAME);

export const systemPromptAppendixAtom = createSettingAtom(
  "SYSTEM_PROMPT_APPENDIX",
  DEFAULT_SETTINGS.SYSTEM_PROMPT_APPENDIX,
);

export const memoryAtom = createSettingAtom<string[]>("MEMORY", DEFAULT_SETTINGS.MEMORY);

export const showMessageActionRowAtom = createSettingAtom<MessageActionRowOption>(
  "SHOW_MESSAGE_ACTION_ROW",
  DEFAULT_SETTINGS.SHOW_MESSAGE_ACTION_ROW,
);

export const chatSortAtom = createSettingAtom<ChatSortOption>(
  "CHAT_SORT",
  DEFAULT_SETTINGS.CHAT_SORT,
);

export const chatBackgroundAtom = createSettingAtom<ChatBackgroundSettings>(
  "CHAT_BACKGROUND",
  DEFAULT_SETTINGS.CHAT_BACKGROUND,
);

export const ttsSettingsAtom = createSettingAtom<TtsSettings>("TTS", DEFAULT_SETTINGS.TTS);

export const titleGenerationAtom = createSettingAtom<TitleGenerationSettings>(
  "TITLE_GENERATION",
  DEFAULT_SETTINGS.TITLE_GENERATION,
);

export const collapsedSidebarLayoutAtom = createSettingAtom<CollapsedSidebarLayoutOption>(
  "COLLAPSED_SIDEBAR_LAYOUT",
  DEFAULT_SETTINGS.COLLAPSED_SIDEBAR_LAYOUT,
);

export const keyboardShortcutsEnabledInInputsAtom = createSettingAtom(
  "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS",
  DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS,
);

export const keyboardShortcutsAtom = createSettingAtom<KeyboardShortcutSettings>(
  "KEYBOARD_SHORTCUTS",
  DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS,
);

export const remendEnabledAtom = createSettingAtom(
  "REMEND_ENABLED",
  DEFAULT_SETTINGS.REMEND_ENABLED,
);

export const showChatToBottomButtonAtom = createSettingAtom(
  "SHOW_CHAT_TO_BOTTOM_BUTTON",
  DEFAULT_SETTINGS.SHOW_CHAT_TO_BOTTOM_BUTTON,
);
