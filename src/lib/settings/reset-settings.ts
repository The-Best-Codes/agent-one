import { getDefaultStore } from "jotai";
import { RESET } from "jotai/utils";

import {
  cerebrasApiKeyAtom,
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
} from "../jotai/api-key-atoms";
import {
  cerebrasConfigAtom,
  googleConfigAtom,
  groqConfigAtom,
  opencodeConfigAtom,
  openrouterConfigAtom,
} from "../jotai/provider-atoms";
import {
  colorThemeAtom,
  enabledToolsAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  fontAtom,
  inputStyleAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  roundnessAtom,
  showChatStatusIndicatorAtom,
  showMessageActionRowAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
  systemPromptAppendixAtom,
  textScaleAtom,
  themeAtom,
  titleGenerationAtom,
  toolConfigsAtom,
  userNameAtom,
} from "../jotai/settings-atoms";
import { type DefaultSettings } from "./types";

/**
 * Resets all settings to their default values.
 * This function updates all Jotai atoms to their default values.
 */
export function resetAllSettings(): void {
  const store = getDefaultStore();

  store.set(markdownHighlightingAtom, RESET);
  store.set(markdownRenderingAtom, RESET);
  store.set(submitKeyAtom, RESET);
  store.set(inputStyleAtom, RESET);
  store.set(maxCodeblockCharsAtom, RESET);
  store.set(maxMessageLengthAtom, RESET);
  store.set(maxToolResultCharsAtom, RESET);
  store.set(experimentalThrottleEnabledAtom, RESET);
  store.set(experimentalThrottleValueAtom, RESET);
  store.set(smoothStreamEnabledAtom, RESET);
  store.set(regenerateOnSaveAtom, RESET);
  store.set(stopButtonBehaviorAtom, RESET);
  store.set(showChatStatusIndicatorAtom, RESET);
  store.set(showMessageActionRowAtom, RESET);
  store.set(themeAtom, RESET);
  store.set(colorThemeAtom, RESET);
  store.set(roundnessAtom, RESET);
  store.set(fontAtom, RESET);
  store.set(notificationSettingAtom, RESET);
  store.set(userNameAtom, RESET);
  store.set(systemPromptAppendixAtom, RESET);
  store.set(googleGenerativeAiApiKeyAtom, RESET);
  store.set(groqApiKeyAtom, RESET);
  store.set(openrouterApiKeyAtom, RESET);
  store.set(cerebrasApiKeyAtom, RESET);
  store.set(enabledToolsAtom, RESET);
  store.set(toolConfigsAtom, RESET);
  store.set(cerebrasConfigAtom, RESET);
  store.set(googleConfigAtom, RESET);
  store.set(groqConfigAtom, RESET);
  store.set(openrouterConfigAtom, RESET);
  store.set(opencodeConfigAtom, RESET);
  store.set(mcpServersAtom, RESET);
  store.set(mcpParallelLoadLimitAtom, RESET);
  store.set(titleGenerationAtom, RESET);
}

/**
 * Resets a specific setting to its default value.
 * @param key - The key of the setting to reset
 */
export function resetSetting(key: keyof DefaultSettings): void {
  const store = getDefaultStore();

  switch (key) {
    case "MARKDOWN_HIGHLIGHTING":
      store.set(markdownHighlightingAtom, RESET);
      break;
    case "MARKDOWN_RENDERING":
      store.set(markdownRenderingAtom, RESET);
      break;
    case "SUBMIT_KEY":
      store.set(submitKeyAtom, RESET);
      break;
    case "INPUT_STYLE":
      store.set(inputStyleAtom, RESET);
      break;
    case "MAX_CODEBLOCK_CHARS":
      store.set(maxCodeblockCharsAtom, RESET);
      break;
    case "MAX_MESSAGE_LENGTH":
      store.set(maxMessageLengthAtom, RESET);
      break;
    case "MAX_TOOL_RESULT_CHARS":
      store.set(maxToolResultCharsAtom, RESET);
      break;
    case "EXPERIMENTAL_THROTTLE_ENABLED":
      store.set(experimentalThrottleEnabledAtom, RESET);
      break;
    case "EXPERIMENTAL_THROTTLE_VALUE":
      store.set(experimentalThrottleValueAtom, RESET);
      break;
    case "SMOOTH_STREAM_ENABLED":
      store.set(smoothStreamEnabledAtom, RESET);
      break;
    case "REGENERATE_ON_SAVE":
      store.set(regenerateOnSaveAtom, RESET);
      break;
    case "STOP_BUTTON_BEHAVIOR":
      store.set(stopButtonBehaviorAtom, RESET);
      break;
    case "SHOW_CHAT_STATUS_INDICATOR":
      store.set(showChatStatusIndicatorAtom, RESET);
      break;
    case "SHOW_MESSAGE_ACTION_ROW":
      store.set(showMessageActionRowAtom, RESET);
      break;
    case "THEME":
      store.set(themeAtom, RESET);
      break;
    case "COLOR_THEME":
      store.set(colorThemeAtom, RESET);
      break;
    case "ROUNDNESS":
      store.set(roundnessAtom, RESET);
      break;
    case "FONT":
      store.set(fontAtom, RESET);
      break;
    case "TEXT_SCALE":
      store.set(textScaleAtom, RESET);
      break;
    case "NOTIFICATION_SETTING":
      store.set(notificationSettingAtom, RESET);
      break;
    case "ENABLED_TOOLS":
      store.set(enabledToolsAtom, RESET);
      break;
    case "TOOL_CONFIGS":
      store.set(toolConfigsAtom, RESET);
      break;
    case "MCP_SERVERS":
      store.set(mcpServersAtom, RESET);
      break;
    case "MCP_PARALLEL_LOAD_LIMIT":
      store.set(mcpParallelLoadLimitAtom, RESET);
      break;
    case "USER_NAME":
      store.set(userNameAtom, RESET);
      break;
    case "SYSTEM_PROMPT_APPENDIX":
      store.set(systemPromptAppendixAtom, RESET);
      break;
    case "GOOGLE_GENERATIVE_AI_API_KEY":
      store.set(googleGenerativeAiApiKeyAtom, RESET);
      break;
    case "GROQ_API_KEY":
      store.set(groqApiKeyAtom, RESET);
      break;
    case "OPENROUTER_API_KEY":
      store.set(openrouterApiKeyAtom, RESET);
      break;
    case "CEREBRAS_API_KEY":
      store.set(cerebrasApiKeyAtom, RESET);
      break;
    case "TITLE_GENERATION":
      store.set(titleGenerationAtom, RESET);
      break;
  }
}
