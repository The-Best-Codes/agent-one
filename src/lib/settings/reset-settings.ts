import { getDefaultStore } from "jotai";

import {
  enabledToolsAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
  notificationSettingAtom,
  openrouterApiKeyAtom,
  regenerateOnSaveAtom,
  roundnessAtom,
  smoothStreamEnabledAtom,
  submitKeyAtom,
  themeAtom,
  userNameAtom,
} from "../jotai/settings-atoms";
import {
  DEFAULT_SETTINGS,
  type DefaultSettings,
  type MarkdownRenderingOption,
  type McpServerConfig,
  type NotificationOption,
  type RoundnessOption,
  type SubmitKeyOption,
  type ThemeOption,
  type ToolId,
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
  store.set(themeAtom, DEFAULT_SETTINGS.THEME as ThemeOption);
  store.set(roundnessAtom, DEFAULT_SETTINGS.ROUNDNESS as RoundnessOption);
  store.set(
    notificationSettingAtom,
    DEFAULT_SETTINGS.NOTIFICATION_SETTING as NotificationOption,
  );
  store.set(userNameAtom, DEFAULT_SETTINGS.USER_NAME);
  store.set(
    googleGenerativeAiApiKeyAtom,
    DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
  );
  store.set(groqApiKeyAtom, DEFAULT_SETTINGS.GROQ_API_KEY);
  store.set(openrouterApiKeyAtom, DEFAULT_SETTINGS.OPENROUTER_API_KEY);
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
    case "THEME":
      store.set(themeAtom, defaultValue as ThemeOption);
      break;
    case "ROUNDNESS":
      store.set(roundnessAtom, defaultValue as RoundnessOption);
      break;
    case "NOTIFICATION_SETTING":
      store.set(notificationSettingAtom, defaultValue as NotificationOption);
      break;
    case "ENABLED_TOOLS":
      store.set(enabledToolsAtom, defaultValue as Record<ToolId, boolean>);
      break;
    case "MCP_SERVERS":
      store.set(mcpServersAtom, defaultValue as McpServerConfig[]);
      break;
    case "MCP_PARALLEL_LOAD_LIMIT":
      store.set(mcpParallelLoadLimitAtom, defaultValue as number);
      break;
    case "USER_NAME":
      store.set(userNameAtom, defaultValue as string);
      break;
    case "GOOGLE_GENERATIVE_AI_API_KEY":
      store.set(googleGenerativeAiApiKeyAtom, defaultValue as string);
      break;
    case "GROQ_API_KEY":
      store.set(groqApiKeyAtom, defaultValue as string);
      break;
    case "OPENROUTER_API_KEY":
      store.set(openrouterApiKeyAtom, defaultValue as string);
      break;
  }
}
