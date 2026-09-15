import type { WritableAtom } from "jotai";

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
} from "./types";

export const settingsSections = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "chats", label: "Chats" },
  { id: "extensions", label: "Extensions", fillHeight: true },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts" },
  { id: "performance", label: "Performance" },
  { id: "providers", label: "Providers" },
  { id: "about", label: "Help & Updates" },
] as const;

export type SettingsSectionId = (typeof settingsSections)[number]["id"];

type SelectOption = { value: string | number; label: string };

export type SettingControl =
  | { type: "switch" }
  | { type: "select"; options: readonly SelectOption[] }
  | { type: "slider"; min: number; max: number; step: number; unit?: string }
  | { type: "input"; inputType?: "text" | "number"; min?: number; max?: number }
  | { type: "textarea" }
  | { type: "component"; component: string };

export interface SettingDefinition {
  id: string;
  key?: string;
  title: string;
  description?: string;
  docs?: string;
  keywords?: readonly string[];
  section: SettingsSectionId;
  card: string;
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

const setting = <T>(
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
    card: "Account, Sync & Access",
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
    card: "Account, Sync & Access",
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
    card: "Profile & Instructions",
    atom: userNameAtom,
    controls: { type: "input" },
  }),
  setting({
    id: "ai-instructions",
    key: "SYSTEM_PROMPT_APPENDIX",
    title: "AI Instructions",
    description: "Additional instructions included in the system prompt.",
    section: "account",
    card: "Profile & Instructions",
    atom: systemPromptAppendixAtom,
    controls: { type: "textarea" },
  }),
  setting({
    id: "theme",
    key: "THEME",
    title: "Theme",
    section: "appearance",
    card: "General Look and Feel",
    atom: themeAtom,
    controls: { type: "select", options: labels(THEME_OPTIONS) },
  }),
  setting({
    id: "primary-color",
    key: "COLOR_THEME",
    title: "Primary Color",
    section: "appearance",
    card: "General Look and Feel",
    atom: colorThemeAtom,
    controls: { type: "select", options: labels(COLOR_THEME_OPTIONS) },
  }),
  setting({
    id: "tint",
    key: "UI_TINT",
    title: "Tint",
    section: "appearance",
    card: "General Look and Feel",
    atom: uiTintAtom,
    controls: { type: "select", options: labels(UI_TINT_OPTIONS) },
  }),
  setting({
    id: "tint-strength",
    key: "UI_TINT_STRENGTH",
    title: "Tint Strength",
    section: "appearance",
    card: "General Look and Feel",
    atom: uiTintStrengthAtom,
    controls: { type: "slider", min: 1, max: 10, step: 1 },
  }),
  setting({
    id: "font",
    key: "FONT",
    title: "Font",
    section: "appearance",
    card: "General Look and Feel",
    atom: fontAtom,
    controls: { type: "select", options: labels(FONT_OPTIONS) },
  }),
  setting({
    id: "roundness",
    key: "ROUNDNESS",
    title: "Roundness",
    section: "appearance",
    card: "General Look and Feel",
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
    card: "General Look and Feel",
    atom: textScaleAtom,
    controls: { type: "select", options: labels(TEXT_SCALE_OPTIONS) },
  }),
  setting({
    id: "markdown-highlighting",
    key: "MARKDOWN_HIGHLIGHTING",
    title: "Markdown Highlighting",
    description: "Enable syntax highlighting in rendered Markdown.",
    section: "appearance",
    card: "Chat Appearance",
    atom: markdownHighlightingAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "input-style",
    key: "INPUT_STYLE",
    title: "Input Style",
    section: "appearance",
    card: "Chat Appearance",
    atom: inputStyleAtom,
    controls: { type: "select", options: labels(INPUT_STYLE_OPTIONS) },
  }),
  setting({
    id: "collapsed-sidebar-layout",
    key: "COLLAPSED_SIDEBAR_LAYOUT",
    title: "Collapsed Sidebar Layout",
    section: "appearance",
    card: "Chat Appearance",
    atom: collapsedSidebarLayoutAtom,
    controls: { type: "select", options: labels(COLLAPSED_SIDEBAR_LAYOUT_OPTIONS) },
  }),
  setting({
    id: "chat-sort-order",
    key: "CHAT_SORT",
    title: "Chat Sort Order",
    description: "Choose how chats are ordered in the sidebar.",
    section: "chats",
    card: "Chat Behavior",
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
    card: "Chat Behavior",
    atom: sidebarChatTimeGroupingAtom,
    controls: { type: "select", options: labels(SIDEBAR_CHAT_TIME_GROUPING_OPTIONS) },
  }),
  setting({
    id: "markdown-rendering",
    key: "MARKDOWN_RENDERING",
    title: "Markdown Rendering",
    section: "chats",
    card: "Chat Behavior",
    atom: markdownRenderingAtom,
    controls: { type: "select", options: labels(MARKDOWN_RENDERING_OPTIONS) },
  }),
  setting({
    id: "remend",
    key: "REMEND_ENABLED",
    title: "Fix Streaming Markdown",
    section: "chats",
    card: "Chat Behavior",
    atom: remendEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "completion-notification",
    key: "NOTIFICATION_SETTING",
    title: "Agent Notifications",
    section: "chats",
    card: "Chat Behavior",
    atom: notificationSettingAtom,
    controls: { type: "select", options: labels(NOTIFICATION_SETTING_OPTIONS) },
  }),
  setting({
    id: "message-action-row",
    key: "SHOW_MESSAGE_ACTION_ROW",
    title: "Message Action Row",
    section: "chats",
    card: "Chat Behavior",
    atom: showMessageActionRowAtom,
    controls: { type: "select", options: labels(SHOW_MESSAGE_ACTION_ROW_OPTIONS) },
  }),
  setting({
    id: "submit-key",
    key: "SUBMIT_KEY",
    title: "Submit Key",
    section: "chats",
    card: "Chat Behavior",
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
    card: "Chat Behavior",
    atom: regenerateOnSaveAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "always-show-stop-button",
    key: "STOP_BUTTON_BEHAVIOR",
    title: "Always Show Stop Button",
    section: "chats",
    card: "Chat Behavior",
    atom: stopButtonBehaviorAtom,
    controls: { type: "select", options: labels(STOP_BUTTON_BEHAVIOR_OPTIONS) },
  }),
  setting({
    id: "show-scroll-to-bottom-button",
    key: "SHOW_CHAT_TO_BOTTOM_BUTTON",
    title: "Chat Scroll to Bottom Button",
    section: "chats",
    card: "Chat Behavior",
    atom: showChatToBottomButtonAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "show-message-preview-rail",
    key: "SHOW_MESSAGE_PREVIEW_RAIL",
    title: "Message Navigation Rail",
    section: "chats",
    card: "Chat Behavior",
    atom: showMessagePreviewRailAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "chat-status-indicators",
    key: "SHOW_CHAT_STATUS_INDICATOR",
    title: "Chat Status Indicators",
    section: "chats",
    card: "Chat Behavior",
    atom: showChatStatusIndicatorAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "smooth-stream",
    key: "SMOOTH_STREAM_ENABLED",
    title: "Smooth Stream",
    section: "chats",
    card: "Streaming Experience",
    atom: smoothStreamEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "extract-reasoning",
    key: "EXTRACT_REASONING_ENABLED",
    title: "Extract Reasoning from Think Tags",
    section: "chats",
    card: "Streaming Experience",
    atom: extractReasoningEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "experimental-throttle",
    key: "EXPERIMENTAL_THROTTLE_ENABLED",
    title: "Experimental Throttle",
    section: "chats",
    card: "Streaming Experience",
    atom: experimentalThrottleEnabledAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "throttle-value",
    key: "EXPERIMENTAL_THROTTLE_VALUE",
    title: "Throttle Value",
    section: "chats",
    card: "Streaming Experience",
    atom: experimentalThrottleValueAtom,
    controls: { type: "slider", min: 0, max: 10000, step: 10, unit: "ms" },
  }),
  setting({
    id: "max-message-length",
    key: "MAX_MESSAGE_LENGTH",
    title: "Max Message Length",
    description: "Maximum characters before activating performance mode for that message.",
    section: "performance",
    card: "Rendering Limits",
    atom: maxMessageLengthAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "max-codeblock-characters",
    key: "MAX_CODEBLOCK_CHARS",
    title: "Max Codeblock Characters",
    description: "Maximum characters in code blocks before switching to plain text rendering.",
    section: "performance",
    card: "Rendering Limits",
    atom: maxCodeblockCharsAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "max-tool-result-characters",
    key: "MAX_TOOL_RESULT_CHARS",
    title: "Max Tool Result Characters",
    description: "Maximum characters in tool results before switching to performant rendering.",
    section: "performance",
    card: "Rendering Limits",
    atom: maxToolResultCharsAtom,
    controls: { type: "input", inputType: "number", min: 1000, max: 1000000 },
  }),
  setting({
    id: "virtualize-chat-messages",
    key: "CHAT_VIRTUALIZATION_MODE",
    title: "Virtualize Chat Messages",
    description:
      "Reduce rendering work for large chats while preserving the same chat UI behavior.",
    section: "performance",
    card: "Chat Virtualization",
    atom: chatVirtualizationModeAtom,
    controls: { type: "select", options: labels(CHAT_VIRTUALIZATION_MODE_OPTIONS) },
  }),
  setting({
    id: "message-count-threshold",
    key: "CHAT_VIRTUALIZATION_THRESHOLD",
    title: "Message Count Threshold",
    description:
      "Only enable chat virtualization when a conversation reaches at least this many messages.",
    section: "performance",
    card: "Chat Virtualization",
    atom: chatVirtualizationThresholdAtom,
    controls: { type: "input", inputType: "number", min: 1, max: 100000 },
  }),
  setting({
    id: "mcp-parallel-load-limit",
    key: "MCP_PARALLEL_LOAD_LIMIT",
    title: "MCP Parallel Load Limit",
    description: "Maximum number of MCP servers loaded concurrently.",
    section: "performance",
    card: "Extension Runtime",
    atom: mcpParallelLoadLimitAtom,
    controls: { type: "input", inputType: "number", min: 1, max: 64 },
  }),
  setting({
    id: "activate-shortcuts-in-input-fields",
    key: "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS",
    title: "Activate Shortcuts in Input Fields",
    section: "keyboard-shortcuts",
    card: "Keyboard Shortcuts",
    atom: keyboardShortcutsEnabledInInputsAtom,
    controls: { type: "switch" },
  }),
  setting({
    id: "allow-usage-analytics",
    key: "ANALYTICS_IDENTITY",
    title: "Allow Usage Analytics",
    section: "about",
    card: "Usage Analytics",
    atom: analyticsIdentityAtom,
    controls: { type: "select", options: labels(ANALYTICS_IDENTITY_OPTIONS) },
  }),
  setting({
    id: "memory",
    key: "MEMORY",
    title: "Memory",
    description: "Facts AgentOne remembers for future conversations.",
    section: "account",
    card: "Profile & Instructions",
    atom: memoryAtom,
    controls: { type: "component", component: "MemoryEditor" },
    aiAccessible: false,
  }),
  setting({
    id: "chat-background",
    key: "CHAT_BACKGROUND",
    title: "Background Image",
    section: "appearance",
    card: "Chat Background",
    atom: chatBackgroundAtom,
    controls: { type: "component", component: "ChatBackgroundPicker" },
    aiAccessible: false,
  }),
  setting({
    id: "generation-method",
    key: "TITLE_GENERATION",
    title: "Generation Method",
    description: "How chat titles should be generated.",
    section: "chats",
    card: "Chat Titles",
    atom: titleGenerationAtom,
    controls: { type: "component", component: "TitleGenerationEditor" },
    aiAccessible: false,
  }),
  {
    id: "chat-background-effects",
    title: "Chat Background Effects",
    section: "appearance",
    card: "Chat Background",
    controls: { type: "component", component: "ChatBackgroundEffects" },
  },
  {
    id: "chat-background-overlay",
    title: "Chat Background Shade",
    section: "appearance",
    card: "Chat Background",
    controls: { type: "component", component: "ChatBackgroundShade" },
  },
  {
    id: "character-limit",
    title: "Character Limit",
    description: "Maximum characters to use from the message.",
    section: "chats",
    card: "Chat Titles",
    controls: { type: "input", inputType: "number", min: 10, max: 200 },
  },
  {
    id: "title-max-output-tokens",
    title: "Max Output Tokens",
    section: "chats",
    card: "Chat Titles",
    controls: { type: "slider", min: 0, max: 64000, step: 64 },
  },
  {
    id: "custom-phrase",
    title: "Custom Phrase",
    description: "The phrase to use as the chat title.",
    section: "chats",
    card: "Chat Titles",
    controls: { type: "input" },
  },
  {
    id: "fallback-phrase",
    title: "Fallback Phrase",
    description: "Used when title generation fails or no content is available.",
    section: "chats",
    card: "Chat Titles",
    controls: { type: "input" },
  },
  {
    id: "associate-analytics-with-my-signed-in-account",
    title: "Associate Analytics with My Signed-in Account",
    section: "about",
    card: "Usage Analytics",
    controls: { type: "switch" },
  },
  {
    id: "model-directory",
    title: "Model List Updates",
    section: "about",
    card: "Model List Updates",
    controls: { type: "component", component: "ModelDirectoryUpdater" },
  },
  {
    id: "built-in-providers",
    title: "Built-in Providers",
    section: "providers",
    card: "Providers",
    controls: { type: "component", component: "BuiltInProviders" },
  },
  {
    id: "local-providers",
    title: "Local Providers",
    section: "providers",
    card: "Providers",
    controls: { type: "component", component: "LocalProviders" },
  },
  {
    id: "custom-providers",
    title: "Custom Providers",
    section: "providers",
    card: "Providers",
    controls: { type: "component", component: "CustomProviders" },
  },
  {
    id: "tts-providers",
    title: "Text-to-Speech Providers",
    section: "providers",
    card: "Providers",
    controls: { type: "component", component: "TtsProviders" },
  },
  {
    id: "built-in-tools",
    title: "Built-in Tools",
    section: "extensions",
    card: "Extensions",
    controls: { type: "component", component: "BuiltInTools" },
  },
  {
    id: "extensions-beta-notice",
    title: "Extensions Beta Notice",
    section: "extensions",
    card: "Extensions",
    controls: { type: "component", component: "ExtensionsBetaNotice" },
  },
  {
    id: "extension-search-and-filters",
    title: "Extension Search and Filters",
    section: "extensions",
    card: "Extensions",
    controls: { type: "component", component: "ExtensionsBrowser" },
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
