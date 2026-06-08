import { getDefaultStore } from "jotai";
import { RESET } from "jotai/utils";

import { PROVIDER_REGISTRY, type ProviderStorageKey } from "@/lib/ai/providers/registry";
import type { TtsProviderId } from "@/lib/settings/types";

import { getApiKeyBaseAtom } from "../jotai/api-key-atoms";
import { providerConfigAtoms } from "../jotai/provider-atoms";
import {
  analyticsIdentityAtom,
  chatBackgroundAtom,
  chatSortAtom,
  chatVirtualizationModeAtom,
  chatVirtualizationThresholdAtom,
  collapsedSidebarLayoutAtom,
  colorThemeAtom,
  enabledToolsAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  extractReasoningEnabledAtom,
  fontAtom,
  inputStyleAtom,
  keyboardShortcutsAtom,
  keyboardShortcutsEnabledInInputsAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  memoryAtom,
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
  ttsSettingsAtom,
  titleGenerationAtom,
  uiTintAtom,
  uiTintStrengthAtom,
  toolConfigsAtom,
  userNameAtom,
} from "../jotai/settings-atoms";
import { type DefaultSettings } from "./types";

const TTS_PROVIDER_IDS: readonly TtsProviderId[] = ["openai", "elevenlabs", "lmnt", "hume"];

export function resetAllSettings(): void {
  const store = getDefaultStore();

  store.set(markdownHighlightingAtom, RESET);
  store.set(markdownRenderingAtom, RESET);
  store.set(submitKeyAtom, RESET);
  store.set(inputStyleAtom, RESET);
  store.set(maxCodeblockCharsAtom, RESET);
  store.set(maxMessageLengthAtom, RESET);
  store.set(maxToolResultCharsAtom, RESET);
  store.set(chatVirtualizationModeAtom, RESET);
  store.set(chatVirtualizationThresholdAtom, RESET);
  store.set(experimentalThrottleEnabledAtom, RESET);
  store.set(experimentalThrottleValueAtom, RESET);
  store.set(smoothStreamEnabledAtom, RESET);
  store.set(extractReasoningEnabledAtom, RESET);
  store.set(regenerateOnSaveAtom, RESET);
  store.set(stopButtonBehaviorAtom, RESET);
  store.set(showChatStatusIndicatorAtom, RESET);
  store.set(showMessageActionRowAtom, RESET);
  store.set(chatSortAtom, RESET);
  store.set(chatBackgroundAtom, RESET);
  store.set(ttsSettingsAtom, RESET);
  store.set(themeAtom, RESET);
  store.set(colorThemeAtom, RESET);
  store.set(uiTintAtom, RESET);
  store.set(uiTintStrengthAtom, RESET);
  store.set(roundnessAtom, RESET);
  store.set(fontAtom, RESET);
  store.set(notificationSettingAtom, RESET);
  store.set(analyticsIdentityAtom, RESET);
  store.set(userNameAtom, RESET);
  store.set(systemPromptAppendixAtom, RESET);
  store.set(memoryAtom, RESET);
  store.set(enabledToolsAtom, RESET);
  store.set(toolConfigsAtom, RESET);
  store.set(mcpServersAtom, RESET);
  store.set(mcpParallelLoadLimitAtom, RESET);
  store.set(titleGenerationAtom, RESET);
  store.set(collapsedSidebarLayoutAtom, RESET);
  store.set(keyboardShortcutsEnabledInInputsAtom, RESET);
  store.set(keyboardShortcutsAtom, RESET);

  for (const provider of PROVIDER_REGISTRY) {
    void store.set(getApiKeyBaseAtom(provider.id), RESET);
    store.set(providerConfigAtoms[provider.id], RESET);
  }

  for (const providerId of TTS_PROVIDER_IDS) {
    void store.set(getApiKeyBaseAtom(`tts-${providerId}`), RESET);
  }
}

function isProviderStorageKey(key: string): key is ProviderStorageKey {
  return PROVIDER_REGISTRY.some((p) => p.storageKey === key);
}

export function resetSetting(key: keyof DefaultSettings): void {
  const store = getDefaultStore();

  if (isProviderStorageKey(key)) {
    const provider = PROVIDER_REGISTRY.find((p) => p.storageKey === key)!;
    void store.set(getApiKeyBaseAtom(provider.id), RESET);
    store.set(providerConfigAtoms[provider.id], RESET);
    return;
  }

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
    case "CHAT_VIRTUALIZATION_MODE":
      store.set(chatVirtualizationModeAtom, RESET);
      break;
    case "CHAT_VIRTUALIZATION_THRESHOLD":
      store.set(chatVirtualizationThresholdAtom, RESET);
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
    case "EXTRACT_REASONING_ENABLED":
      store.set(extractReasoningEnabledAtom, RESET);
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
    case "CHAT_SORT":
      store.set(chatSortAtom, RESET);
      break;
    case "CHAT_BACKGROUND":
      store.set(chatBackgroundAtom, RESET);
      break;
    case "TTS":
      store.set(ttsSettingsAtom, RESET);
      break;
    case "THEME":
      store.set(themeAtom, RESET);
      break;
    case "COLOR_THEME":
      store.set(colorThemeAtom, RESET);
      break;
    case "UI_TINT":
      store.set(uiTintAtom, RESET);
      break;
    case "UI_TINT_STRENGTH":
      store.set(uiTintStrengthAtom, RESET);
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
    case "ANALYTICS_IDENTITY":
      store.set(analyticsIdentityAtom, RESET);
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
    case "MEMORY":
      store.set(memoryAtom, RESET);
      break;
    case "TITLE_GENERATION":
      store.set(titleGenerationAtom, RESET);
      break;
    case "COLLAPSED_SIDEBAR_LAYOUT":
      store.set(collapsedSidebarLayoutAtom, RESET);
      break;
    case "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS":
      store.set(keyboardShortcutsEnabledInInputsAtom, RESET);
      break;
    case "KEYBOARD_SHORTCUTS":
      store.set(keyboardShortcutsAtom, RESET);
      break;
  }
}
