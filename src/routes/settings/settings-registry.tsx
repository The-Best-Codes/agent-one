import type { WritableAtom } from "jotai";
import type { ComponentType } from "react";

import { hideAgentOneModelsAtom, syncEnabledAtom } from "@/lib/jotai/atoms";
import {
  analyticsIdentityAtom,
  chatBackgroundAtom,
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
  memoryAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  remendEnabledAtom,
  roundnessAtom,
  showChatStatusIndicatorAtom,
  showChatToBottomButtonAtom,
  showMessageActionRowAtom,
  showMessagePreviewRailAtom,
  sidebarChatTimeGroupingAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
  systemPromptAppendixAtom,
  textScaleAtom,
  themeAtom,
  titleGenerationAtom,
  uiTintAtom,
  uiTintStrengthAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";
import {
  ANALYTICS_IDENTITY_OPTIONS,
  CHAT_SORT_OPTIONS,
  CHAT_VIRTUALIZATION_MODE_OPTIONS,
  COLLAPSED_SIDEBAR_LAYOUT_OPTIONS,
  COLOR_THEME_OPTIONS,
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  INPUT_STYLE_OPTIONS,
  MARKDOWN_RENDERING_OPTIONS,
  NOTIFICATION_SETTING_OPTIONS,
  ROUNDNESS_OPTIONS,
  SHOW_MESSAGE_ACTION_ROW_OPTIONS,
  SIDEBAR_CHAT_TIME_GROUPING_OPTIONS,
  STOP_BUTTON_BEHAVIOR_OPTIONS,
  SUBMIT_KEY_OPTIONS,
  TEXT_SCALE_OPTIONS,
  THEME_OPTIONS,
  UI_TINT_OPTIONS,
} from "@/lib/settings/types";

import AccountSyncSettings from "./custom-components/account-sync";
import AnalyticsSettings from "./custom-components/analytics";
import AppUpdateSettings from "./custom-components/app-updates";
import AppearanceSettings from "./custom-components/appearance";
import BuiltInProvidersSettings from "./custom-components/built-in-providers";
import ChatAppearanceSettings from "./custom-components/chat-appearance";
import ChatBackgroundSettings from "./custom-components/chat-background";
import ChatBehaviorSettings from "./custom-components/chat-behavior";
import ChatTitleSettings from "./custom-components/chat-titles";
import ChatVirtualizationSettings from "./custom-components/chat-virtualization";
import CustomProvidersSettings from "./custom-components/custom-providers";
import DebugSettings from "./custom-components/debug";
import ExtensionRuntimeSettings from "./custom-components/extension-runtime";
import HelpSettings from "./custom-components/help";
import KeyboardShortcutSettings from "./custom-components/keyboard-shortcuts";
import LocalProvidersSettings from "./custom-components/local-providers";
import ModelUpdateSettings from "./custom-components/model-updates";
import ProfileInstructionsSettings from "./custom-components/profile-instructions";
import RenderingLimitSettings from "./custom-components/rendering-limits";
import StreamingSettings from "./custom-components/streaming";
import TextToSpeechSettings from "./custom-components/text-to-speech";
import ExtensionsSettings from "./sections/extensions";

export interface SettingsSection {
  id: string;
  label: string;
  component: ComponentType;
  fillHeight?: boolean;
  requiresDebugMode?: boolean;
}

export const sections = [
  { id: "account", label: "Account & Sync", component: AccountSyncSettings },
  { id: "profile", label: "Profile & Instructions", component: ProfileInstructionsSettings },
  { id: "appearance", label: "Appearance", component: AppearanceSettings },
  { id: "chat-background", label: "Chat Background", component: ChatBackgroundSettings },
  { id: "chat-appearance", label: "Chat Appearance", component: ChatAppearanceSettings },
  { id: "chats", label: "Chat Behavior", component: ChatBehaviorSettings },
  { id: "streaming", label: "Streaming", component: StreamingSettings },
  { id: "chat-titles", label: "Chat Titles", component: ChatTitleSettings },
  { id: "rendering-limits", label: "Rendering Limits", component: RenderingLimitSettings },
  {
    id: "chat-virtualization",
    label: "Chat Virtualization",
    component: ChatVirtualizationSettings,
  },
  { id: "extension-runtime", label: "Extension Runtime", component: ExtensionRuntimeSettings },
  { id: "extensions", label: "Extensions", component: ExtensionsSettings, fillHeight: true },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", component: KeyboardShortcutSettings },
  { id: "built-in-providers", label: "Built-in Providers", component: BuiltInProvidersSettings },
  { id: "local-providers", label: "Local Providers", component: LocalProvidersSettings },
  { id: "custom-providers", label: "Custom Providers", component: CustomProvidersSettings },
  { id: "text-to-speech", label: "Text-to-Speech", component: TextToSpeechSettings },
  { id: "app-updates", label: "App Updates", component: AppUpdateSettings },
  { id: "model-updates", label: "Model List Updates", component: ModelUpdateSettings },
  { id: "help", label: "Help", component: HelpSettings },
  { id: "analytics", label: "Usage Analytics", component: AnalyticsSettings },
  { id: "debug", label: "Debug", component: DebugSettings, requiresDebugMode: true },
] as const satisfies readonly SettingsSection[];

export type SettingsSectionId = (typeof sections)[number]["id"];

type SelectOption = { value: string | number; label: string };

export type SettingControl =
  | { type: "switch" }
  | { type: "select"; options: readonly SelectOption[] }
  | { type: "slider"; min: number; max: number; step: number; unit?: string }
  | { type: "input"; inputType?: "text" | "number"; min?: number; max?: number }
  | { type: "textarea" }
  | { type: "component" };

export interface SettingDefinition {
  id: string;
  key?: string;
  title: string;
  description?: string;
  docs?: string;
  keywords?: readonly string[];
  section: SettingsSectionId;
  atom?: WritableAtom<unknown, [unknown], unknown>;
  defaultValue?: unknown;
  controls: SettingControl;
  aiAccessible?: boolean;
}

const labels = <T extends string | number>(
  values: readonly T[],
  optionLabels: Partial<Record<T, string>> = {},
): readonly SelectOption[] =>
  values.map((value) => ({
    value,
    label:
      optionLabels[value] ??
      String(value)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
  }));

const setting = <T,>(
  definition: Omit<SettingDefinition, "atom" | "defaultValue"> & {
    key: keyof typeof DEFAULT_SETTINGS;
    atom: WritableAtom<T, [T], unknown>;
  },
): SettingDefinition => ({
  ...definition,
  atom: definition.atom as WritableAtom<unknown, [unknown], unknown>,
  defaultValue: DEFAULT_SETTINGS[definition.key],
  aiAccessible: definition.aiAccessible ?? true,
});

export const settingsRegistry = [
  {
    id: "synchronize-my-settings",
    title: "Synchronize My Settings",
    description: "Sync your settings between devices when signed in.",
    keywords: ["sync", "devices", "account"],
    section: "account",
    atom: syncEnabledAtom as WritableAtom<unknown, [unknown], unknown>,
    defaultValue: true,
    controls: { type: "switch" },
  },
  {
    id: "hide-agentone-models",
    title: "Hide AgentOne Models",
    description:
      "When enabled, models from AgentOne will not be shown in the list of available models.",
    docs: "https://docs.agent-one.dev/docs/desktop-app/settings#hide-agentone-models",
    keywords: ["default models", "disable agentone models"],
    section: "account",
    atom: hideAgentOneModelsAtom as WritableAtom<unknown, [unknown], unknown>,
    defaultValue: false,
    controls: { type: "switch" },
  },
  setting({
    id: "your-name",
    key: "USER_NAME",
    title: "Your Name",
    description: "The name AgentOne should use for you.",
    section: "account",
    atom: userNameAtom,
    controls: { type: "input" },
  }),
  setting({
    id: "ai-instructions",
    key: "SYSTEM_PROMPT_APPENDIX",
    title: "AI Instructions",
    description: "Additional instructions included in the system prompt.",
    section: "account",
    atom: systemPromptAppendixAtom,
    controls: { type: "textarea" },
  }),
  setting({
    id: "theme",
    key: "THEME",
    title: "Theme",
    section: "appearance",
    atom: themeAtom,
    controls: { type: "select", options: labels(THEME_OPTIONS) },
  }),
  setting({
    id: "primary-color",
    key: "COLOR_THEME",
    title: "Primary Color",
    section: "appearance",
    atom: colorThemeAtom,
    controls: { type: "select", options: labels(COLOR_THEME_OPTIONS) },
  }),
  setting({
    id: "tint",
    key: "UI_TINT",
    title: "Tint",
    section: "appearance",
    atom: uiTintAtom,
    controls: { type: "select", options: labels(UI_TINT_OPTIONS) },
  }),
  setting({
    id: "tint-strength",
    key: "UI_TINT_STRENGTH",
    title: "Tint Strength",
    section: "appearance",
    atom: uiTintStrengthAtom,
    controls: { type: "slider", min: 1, max: 10, step: 1 },
  }),
  setting({
    id: "font",
    key: "FONT",
    title: "Font",
    section: "appearance",
    atom: fontAtom,
    controls: { type: "select", options: labels(FONT_OPTIONS) },
  }),
  setting({
    id: "roundness",
    key: "ROUNDNESS",
    title: "Roundness",
    section: "appearance",
    atom: roundnessAtom,
    controls: {
      type: "select",
      options: labels(ROUNDNESS_OPTIONS, { none: "None", sm: "Small", md: "Medium", lg: "Large" }),
    },
  }),
  setting({
    id: "text-scale",
    key: "TEXT_SCALE",
    title: "Text Scale",
    section: "appearance",
    atom: textScaleAtom,
    controls: { type: "select", options: labels(TEXT_SCALE_OPTIONS) },
  }),
  setting({
    id: "markdown-highlighting",
    key: "MARKDOWN_HIGHLIGHTING",
    title: "Markdown Highlighting",
    description: "Enable syntax highlighting in rendered Markdown.",
    section: "appearance",
    atom: markdownHighlightingAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "input-style",
    key: "INPUT_STYLE",
    title: "Input Style",
    section: "appearance",
    atom: inputStyleAtom,
    controls: { type: "select", options: labels(INPUT_STYLE_OPTIONS) },
  }),
  setting({
    id: "collapsed-sidebar-layout",
    key: "COLLAPSED_SIDEBAR_LAYOUT",
    title: "Collapsed Sidebar Layout",
    section: "appearance",
    atom: collapsedSidebarLayoutAtom,
    controls: { type: "select", options: labels(COLLAPSED_SIDEBAR_LAYOUT_OPTIONS) },
  }),
  setting({
    id: "chat-sort-order",
    key: "CHAT_SORT",
    title: "Chat Sort Order",
    description: "Choose how chats are ordered in the sidebar.",
    section: "chats",
    atom: chatSortAtom,
    controls: {
      type: "select",
      options: labels(CHAT_SORT_OPTIONS, {
        "created-at": "Creation time",
        "updated-at": "Last updated",
      }),
    },
  }),
  setting({
    id: "sidebar-chat-time-grouping",
    key: "SIDEBAR_CHAT_TIME_GROUPING",
    title: "Group Sidebar Chats by Time",
    section: "chats",
    atom: sidebarChatTimeGroupingAtom,
    controls: { type: "select", options: labels(SIDEBAR_CHAT_TIME_GROUPING_OPTIONS) },
  }),
  setting({
    id: "markdown-rendering",
    key: "MARKDOWN_RENDERING",
    title: "Markdown Rendering",
    section: "chats",
    atom: markdownRenderingAtom,
    controls: { type: "select", options: labels(MARKDOWN_RENDERING_OPTIONS) },
  }),
  setting({
    id: "remend",
    key: "REMEND_ENABLED",
    title: "Fix Streaming Markdown",
    section: "chats",
    atom: remendEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "completion-notification",
    key: "NOTIFICATION_SETTING",
    title: "Agent Notifications",
    section: "chats",
    atom: notificationSettingAtom,
    controls: { type: "select", options: labels(NOTIFICATION_SETTING_OPTIONS) },
  }),
  setting({
    id: "message-action-row",
    key: "SHOW_MESSAGE_ACTION_ROW",
    title: "Message Action Row",
    section: "chats",
    atom: showMessageActionRowAtom,
    controls: { type: "select", options: labels(SHOW_MESSAGE_ACTION_ROW_OPTIONS) },
  }),
  setting({
    id: "submit-key",
    key: "SUBMIT_KEY",
    title: "Submit Key",
    section: "chats",
    atom: submitKeyAtom,
    controls: {
      type: "select",
      options: labels(SUBMIT_KEY_OPTIONS, { enter: "Enter", "ctrl-enter": "Ctrl + Enter" }),
    },
  }),
  setting({
    id: "regenerate-on-save",
    key: "REGENERATE_ON_SAVE",
    title: "Regenerate on Save",
    section: "chats",
    atom: regenerateOnSaveAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "always-show-stop-button",
    key: "STOP_BUTTON_BEHAVIOR",
    title: "Always Show Stop Button",
    section: "chats",
    atom: stopButtonBehaviorAtom,
    controls: { type: "select", options: labels(STOP_BUTTON_BEHAVIOR_OPTIONS) },
  }),
  setting({
    id: "show-scroll-to-bottom-button",
    key: "SHOW_CHAT_TO_BOTTOM_BUTTON",
    title: "Chat Scroll to Bottom Button",
    section: "chats",
    atom: showChatToBottomButtonAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "show-message-preview-rail",
    key: "SHOW_MESSAGE_PREVIEW_RAIL",
    title: "Message Navigation Rail",
    section: "chats",
    atom: showMessagePreviewRailAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "chat-status-indicators",
    key: "SHOW_CHAT_STATUS_INDICATOR",
    title: "Chat Status Indicators",
    section: "chats",
    atom: showChatStatusIndicatorAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "smooth-stream",
    key: "SMOOTH_STREAM_ENABLED",
    title: "Smooth Stream",
    section: "chats",
    atom: smoothStreamEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "extract-reasoning",
    key: "EXTRACT_REASONING_ENABLED",
    title: "Extract Reasoning from Think Tags",
    section: "chats",
    atom: extractReasoningEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "experimental-throttle",
    key: "EXPERIMENTAL_THROTTLE_ENABLED",
    title: "Experimental Throttle",
    section: "chats",
    atom: experimentalThrottleEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "throttle-value",
    key: "EXPERIMENTAL_THROTTLE_VALUE",
    title: "Throttle Value",
    section: "chats",
    atom: experimentalThrottleValueAtom,
    controls: { type: "slider", min: 0, max: 10000, step: 10, unit: "ms" },
  }),
  setting({
    id: "max-message-length",
    key: "MAX_MESSAGE_LENGTH",
    title: "Max Message Length",
    description: "Maximum characters before activating performance mode for that message.",
    section: "rendering-limits",
    atom: maxMessageLengthAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "max-codeblock-characters",
    key: "MAX_CODEBLOCK_CHARS",
    title: "Max Codeblock Characters",
    description: "Maximum characters in code blocks before switching to plain text rendering.",
    section: "rendering-limits",
    atom: maxCodeblockCharsAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "max-tool-result-characters",
    key: "MAX_TOOL_RESULT_CHARS",
    title: "Max Tool Result Characters",
    description: "Maximum characters in tool results before switching to performant rendering.",
    section: "rendering-limits",
    atom: maxToolResultCharsAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "virtualize-chat-messages",
    key: "CHAT_VIRTUALIZATION_MODE",
    title: "Virtualize Chat Messages",
    description:
      "Reduce rendering work for large chats while preserving the same chat UI behavior.",
    section: "chat-virtualization",
    atom: chatVirtualizationModeAtom,
    controls: { type: "select", options: labels(CHAT_VIRTUALIZATION_MODE_OPTIONS) },
  }),
  setting({
    id: "message-count-threshold",
    key: "CHAT_VIRTUALIZATION_THRESHOLD",
    title: "Message Count Threshold",
    description:
      "Only enable chat virtualization when a conversation reaches at least this many messages.",
    section: "chat-virtualization",
    atom: chatVirtualizationThresholdAtom,
    controls: { type: "input", inputType: "number", min: 1, max: 100000 },
  }),
  setting({
    id: "mcp-parallel-load-limit",
    key: "MCP_PARALLEL_LOAD_LIMIT",
    title: "MCP Parallel Load Limit",
    description: "Maximum number of MCP servers loaded concurrently.",
    section: "extension-runtime",
    atom: mcpParallelLoadLimitAtom,
    controls: { type: "input", inputType: "number", min: 1, max: 64 },
  }),
  setting({
    id: "activate-shortcuts-in-input-fields",
    key: "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS",
    title: "Activate Shortcuts in Input Fields",
    section: "keyboard-shortcuts",
    atom: keyboardShortcutsEnabledInInputsAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "allow-usage-analytics",
    key: "ANALYTICS_IDENTITY",
    title: "Allow Usage Analytics",
    section: "analytics",
    atom: analyticsIdentityAtom,
    controls: { type: "select", options: labels(ANALYTICS_IDENTITY_OPTIONS) },
  }),
  setting({
    id: "memory",
    key: "MEMORY",
    title: "Memory",
    description: "Facts AgentOne remembers for future conversations.",
    section: "account",
    atom: memoryAtom,
    controls: { type: "component" },
    aiAccessible: false,
  }),
  setting({
    id: "chat-background",
    key: "CHAT_BACKGROUND",
    title: "Background Image",
    section: "appearance",
    atom: chatBackgroundAtom,
    controls: { type: "component" },
    aiAccessible: false,
  }),
  setting({
    id: "generation-method",
    key: "TITLE_GENERATION",
    title: "Generation Method",
    description: "How chat titles should be generated.",
    section: "chats",
    atom: titleGenerationAtom,
    controls: { type: "component" },
    aiAccessible: false,
  }),
  {
    id: "chat-background-effects",
    title: "Chat Background Effects",
    section: "appearance",
    controls: { type: "component" },
  },
  {
    id: "chat-background-overlay",
    title: "Chat Background Shade",
    section: "appearance",
    controls: { type: "component" },
  },
  {
    id: "character-limit",
    title: "Character Limit",
    description: "Maximum characters to use from the message.",
    section: "chats",
    controls: { type: "input", inputType: "number", min: 10, max: 200 },
  },
  {
    id: "title-max-output-tokens",
    title: "Max Output Tokens",
    section: "chats",
    controls: { type: "slider", min: 0, max: 64000, step: 64 },
  },
  {
    id: "custom-phrase",
    title: "Custom Phrase",
    description: "The phrase to use as the chat title.",
    section: "chats",
    controls: { type: "input" },
  },
  {
    id: "fallback-phrase",
    title: "Fallback Phrase",
    description: "Used when title generation fails or no content is available.",
    section: "chats",
    controls: { type: "input" },
  },
  {
    id: "associate-analytics-with-my-signed-in-account",
    title: "Associate Analytics with My Signed-in Account",
    section: "analytics",
    controls: { type: "switch" },
  },
  {
    id: "model-directory",
    title: "Model List Updates",
    section: "model-updates",
    controls: { type: "component" },
  },
  {
    id: "built-in-providers",
    title: "Built-in Providers",
    section: "built-in-providers",
    controls: { type: "component" },
  },
  {
    id: "local-providers",
    title: "Local Providers",
    section: "local-providers",
    controls: { type: "component" },
  },
  {
    id: "custom-providers",
    title: "Custom Providers",
    section: "custom-providers",
    controls: { type: "component" },
  },
  {
    id: "tts-providers",
    title: "Text-to-Speech Providers",
    section: "text-to-speech",
    controls: { type: "component" },
  },
  {
    id: "built-in-tools",
    title: "Built-in Tools",
    section: "extensions",
    controls: { type: "component" },
  },
  {
    id: "extensions-beta-notice",
    title: "Extensions Beta Notice",
    section: "extensions",
    controls: { type: "component" },
  },
  {
    id: "extension-search-and-filters",
    title: "Extension Search and Filters",
    section: "extensions",
    controls: { type: "component" },
  },
] satisfies readonly SettingDefinition[];

const byId = new Map(settingsRegistry.map((definition) => [definition.id, definition]));
const byKey = new Map(
  settingsRegistry.flatMap((definition) => (definition.key ? [[definition.key, definition]] : [])),
);

export function getSettingDefinition(idOrKey: string): SettingDefinition | undefined {
  return byId.get(idOrKey.replace(/^setting-/, "")) ?? byKey.get(idOrKey);
}

export function getAiSettings(): SettingDefinition[] {
  return settingsRegistry.filter(
    (definition) => definition.aiAccessible !== false && definition.key && definition.atom,
  );
}

export function validateSettingValue(definition: SettingDefinition, value: unknown): string | null {
  if (definition.controls.type === "select") {
    return definition.controls.options.some((option) => option.value === value)
      ? null
      : `Value ${JSON.stringify(value)} is not valid. Valid options are: ${definition.controls.options.map((option) => JSON.stringify(option.value)).join(", ")}`;
  }
  if (definition.controls.type === "switch" && typeof value !== "boolean") {
    return `Expected type boolean, but received ${typeof value}`;
  }
  if (
    (definition.controls.type === "slider" ||
      (definition.controls.type === "input" && definition.controls.inputType === "number")) &&
    typeof value !== "number"
  ) {
    return `Expected type number, but received ${typeof value}`;
  }
  if (
    (definition.controls.type === "textarea" ||
      (definition.controls.type === "input" && definition.controls.inputType !== "number")) &&
    typeof value !== "string"
  ) {
    return `Expected type string, but received ${typeof value}`;
  }
  return null;
}

const legacySectionIds: Record<string, SettingsSectionId> = {
  performance: "rendering-limits",
  about: "app-updates",
  providers: "built-in-providers",
};

export function resolveSettingsSection(section: string): SettingsSectionId | undefined {
  return sections.find((candidate) => candidate.id === section)?.id ?? legacySectionIds[section];
}

export function isValidSection(section: string): section is SettingsSectionId {
  return resolveSettingsSection(section) !== undefined;
}

export function getSectionComponent(section: string): ComponentType | undefined {
  const resolvedSection = resolveSettingsSection(section);
  return sections.find((candidate) => candidate.id === resolvedSection)?.component;
}
