import type { Atom } from "jotai";

import { hideAgentOneModelsAtom, syncEnabledAtom } from "@/lib/jotai/app-preference-atoms";
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
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
  memoryAtom,
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
  type DefaultSettings,
  INPUT_STYLE_OPTIONS,
  MARKDOWN_RENDERING_OPTIONS,
  NOTIFICATION_SETTING_OPTIONS,
  SHOW_MESSAGE_ACTION_ROW_OPTIONS,
  SIDEBAR_CHAT_TIME_GROUPING_OPTIONS,
  STOP_BUTTON_BEHAVIOR_OPTIONS,
  SUBMIT_KEY_OPTIONS,
  TEXT_SCALE_OPTIONS,
  THEME_OPTIONS,
  UI_TINT_OPTIONS,
} from "./types";

/**
 * Settings that need UI the registry cannot describe declaratively (photo pickers,
 * list editors, provider browsers, ...) are referenced here by id. The ids are
 * mapped to components in `@/routes/settings/custom-components`, which is
 * exhaustively typechecked against this union.
 */
export type SettingComponentId =
  | "account-overview"
  | "analytics-enabled"
  | "analytics-identity"
  | "app-update"
  | "chat-background"
  | "chat-background-effects"
  | "chat-background-overlay"
  | "custom-providers"
  | "debug-tools"
  | "extensions"
  | "help"
  | "keyboard-shortcuts"
  | "local-providers"
  | "memory"
  | "model-directory"
  | "built-in-providers"
  | "text-to-speech";

export type SettingSectionId =
  | "account"
  | "profile"
  | "appearance"
  | "keyboard-shortcuts"
  | "chats"
  | "streaming"
  | "chat-titles"
  | "rendering-limits"
  | "chat-virtualization"
  | "extension-runtime"
  | "built-in-providers"
  | "local-providers"
  | "custom-providers"
  | "text-to-speech"
  | "extensions"
  | "app-updates"
  | "model-updates"
  | "help"
  | "analytics"
  | "debug";

export interface SettingsSectionDefinition {
  id: SettingSectionId;
  label: string;
  /** Sidebar heading this section is listed under. */
  group?: string;
  /** Section content fills the available height instead of scrolling the page. */
  fillHeight?: boolean;
  /** Section is only listed and reachable while debug mode is enabled. */
  requiresDebugMode?: boolean;
}

export interface SettingSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  /** Applied to the option button, used by the toggle appearance to preview a font. */
  itemClassName?: string;
  /** Rounded preview swatch, used by the toggle appearance to preview roundness. */
  swatchClassName?: string;
}

export type SettingSelectAppearance = "dropdown" | "toggle" | "color" | "theme";

export interface SettingControlBase {
  /** Replaces the generated control with a custom component. */
  componentId?: SettingComponentId;
  /** Defaults to inline for switches, selects and inputs, stacked for sliders and custom UI. */
  layout?: "inline" | "stacked";
}

export type SettingControl = SettingControlBase &
  (
    | {
        type: "switch";
        /** When set, the switch is disabled while signed out and explains why. */
        signedOutHint?: string;
      }
    | {
        type: "select";
        options: readonly SettingSelectOption[];
        appearance?: SettingSelectAppearance;
      }
    | {
        type: "slider";
        min: number;
        max: number;
        step: number;
        unit?: string;
        /** Stored value that `min` represents, used by settings that support "no limit". */
        minValue?: unknown;
        formatValue?: (value: number) => string;
      }
    | { type: "number"; min?: number; max?: number; unit?: string }
    | { type: "text"; multiline?: boolean; maxLength?: number; placeholder?: string }
    | { type: "custom"; componentId: SettingComponentId }
  );

export interface SettingVisibility {
  atom: Atom<unknown>;
  path?: readonly string[];
  equals?: unknown;
  notEquals?: unknown;
  oneOf?: readonly unknown[];
}

export interface SettingDefinition {
  /** Stable id. The settings anchor is `#setting-${id}`. */
  id: string;
  title: string;
  description?: string;
  /** Link to user-facing documentation for this setting. */
  docs?: string;
  keywords?: readonly string[];
  /** Key in `DEFAULT_SETTINGS`, which also makes the setting resettable. */
  key?: keyof DefaultSettings;
  atom?: Atom<unknown>;
  /** Path into an object-valued atom, for settings stored inside a larger object. */
  path?: readonly string[];
  control: SettingControl;
  /** Defaults to true for top-level settings with a key and a declarative control. */
  aiAccessible?: boolean;
  /** Only rendered while the condition holds. */
  visibleWhen?: SettingVisibility;
}

export interface SettingGroupDefinition {
  id: string;
  title: string;
  description?: string;
  section: SettingSectionId;
  /** Renders `SettingsTarget id="setting-${anchor}"` around the whole group. */
  anchor?: string;
  /** Anchors rendered inside a custom component, so deep links resolve to this section. */
  extraTargetIds?: readonly string[];
  /** Custom content rendered above the group's settings. */
  componentId?: SettingComponentId;
  /** The component renders its own card instead of being wrapped in one. */
  frameless?: boolean;
  /** Card-level reset button that restores this key. */
  resetKey?: keyof DefaultSettings;
  settings?: readonly SettingDefinition[];
}

const titleCase = (value: string) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const labels = <T extends string | number>(
  values: readonly T[],
  optionLabels: Partial<Record<T, string>> = {},
): readonly SettingSelectOption[] =>
  values.map((value) => ({ value, label: optionLabels[value] ?? titleCase(String(value)) }));

const colorLabels = (values: readonly string[]): readonly SettingSelectOption[] =>
  values.map((value) => ({ value, label: titleCase(value) }));

const fontOptions: readonly SettingSelectOption[] = [
  { value: "default", label: "Default", itemClassName: "font-space-grotesk" },
  { value: "system", label: "System", itemClassName: "font-sans" },
  { value: "mono", label: "Mono", itemClassName: "font-mono" },
  { value: "roboto", label: "Roboto", itemClassName: "font-roboto" },
];

const roundnessOptions: readonly SettingSelectOption[] = [
  { value: "none", label: "Not Round", swatchClassName: "rounded-[0px]" },
  { value: "sm", label: "Slightly Round", swatchClassName: "rounded-[0.3125rem]" },
  { value: "md", label: "Round", swatchClassName: "rounded-[0.625rem]" },
  { value: "lg", label: "Very Round", swatchClassName: "rounded-[1.25rem]" },
];

const sectionDefinitions = [
  { id: "account", label: "Account & Sync", group: "General" },
  { id: "profile", label: "Profile & Instructions", group: "General" },
  { id: "appearance", label: "Appearance", group: "General" },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", group: "General" },
  { id: "chats", label: "Chat Behavior", group: "Chat" },
  { id: "streaming", label: "Streaming", group: "Chat" },
  { id: "chat-titles", label: "Chat Titles", group: "Chat" },
  { id: "rendering-limits", label: "Rendering Limits", group: "Performance" },
  { id: "chat-virtualization", label: "Chat Virtualization", group: "Performance" },
  { id: "extension-runtime", label: "Extension Runtime", group: "Performance" },
  { id: "built-in-providers", label: "Built-in Providers", group: "Providers & Extensions" },
  { id: "local-providers", label: "Local Providers", group: "Providers & Extensions" },
  { id: "custom-providers", label: "Custom Providers", group: "Providers & Extensions" },
  { id: "text-to-speech", label: "Text-to-Speech", group: "Providers & Extensions" },
  {
    id: "extensions",
    label: "Extensions",
    group: "Providers & Extensions",
    fillHeight: true,
  },
  { id: "app-updates", label: "App Updates", group: "About" },
  { id: "model-updates", label: "Model List Updates", group: "About" },
  { id: "help", label: "Help", group: "About" },
  { id: "analytics", label: "Usage Analytics", group: "About" },
  { id: "debug", label: "Debug", group: "About", requiresDebugMode: true },
] satisfies readonly SettingsSectionDefinition[];

export const sections: readonly SettingsSectionDefinition[] = sectionDefinitions;

export const settingGroups = [
  {
    id: "account-access",
    title: "Account, Sync & Access",
    section: "account",
    componentId: "account-overview",
    settings: [
      {
        id: "synchronize-my-settings",
        title: "Synchronize My Settings",
        description: "Keep your settings in sync across devices using your AgentOne account.",
        keywords: ["sync", "devices", "account"],
        atom: syncEnabledAtom,
        control: { type: "switch", signedOutHint: "Sign in to enable sync" },
        aiAccessible: false,
      },
      {
        id: "hide-agentone-models",
        title: "Hide AgentOne Models",
        description: "Remove AgentOne models from the model selector.",
        docs: "https://docs.agent-one.dev/docs/desktop-app/settings#hide-agentone-models",
        keywords: ["default models", "disable agentone models"],
        atom: hideAgentOneModelsAtom,
        control: {
          type: "switch",
          signedOutHint: "You won't see AgentOne models unless signed-in",
        },
        aiAccessible: false,
      },
    ],
  },
  {
    id: "profile-instructions",
    title: "Profile & Instructions",
    section: "profile",
    settings: [
      {
        id: "your-name",
        key: "USER_NAME",
        atom: userNameAtom,
        title: "Your Name",
        description: "AgentOne will use this name to address you.",
        control: { type: "text", placeholder: "Enter your name", layout: "stacked" },
      },
      {
        id: "ai-instructions",
        key: "SYSTEM_PROMPT_APPENDIX",
        atom: systemPromptAppendixAtom,
        title: "AI Instructions",
        description:
          "Add custom instructions that will be appended to the system prompt. These will guide how AgentOne responds to you.",
        control: {
          type: "text",
          multiline: true,
          maxLength: 2000,
          placeholder: "e.g., Always use British English. Be concise and technical.",
        },
      },
      {
        id: "memory",
        key: "MEMORY",
        atom: memoryAtom,
        title: "Memory",
        description:
          "Save the things you want AgentOne to remember about you across chats, like your preferences, goals, or ongoing projects.",
        control: { type: "custom", componentId: "memory" },
      },
    ],
  },
  {
    id: "look-and-feel",
    title: "General Look and Feel",
    section: "appearance",
    settings: [
      {
        id: "theme",
        key: "THEME",
        atom: themeAtom,
        title: "Theme",
        keywords: ["light", "dark", "system"],
        control: { type: "select", options: labels(THEME_OPTIONS), appearance: "theme" },
      },
      {
        id: "primary-color",
        key: "COLOR_THEME",
        atom: colorThemeAtom,
        title: "Primary Color",
        description:
          "Controls the accent color used for switches, badges, highlights, and primary actions.",
        keywords: ["accent", "colors"],
        control: {
          type: "select",
          options: colorLabels(COLOR_THEME_OPTIONS),
          appearance: "color",
        },
      },
      {
        id: "tint",
        key: "UI_TINT",
        atom: uiTintAtom,
        title: "Tint",
        description:
          "Adds a subtle color wash to surfaces like backgrounds, panels, sidebars, and muted buttons.",
        keywords: ["colors", "wash"],
        control: { type: "select", options: colorLabels(UI_TINT_OPTIONS), appearance: "color" },
      },
      {
        id: "tint-strength",
        key: "UI_TINT_STRENGTH",
        atom: uiTintStrengthAtom,
        title: "Tint Strength",
        description: "Choose how light or strong the tint should feel.",
        control: { type: "slider", min: 1, max: 10, step: 1, unit: "/10" },
      },
      {
        id: "font",
        key: "FONT",
        atom: fontAtom,
        title: "Font",
        description: "Choose the font for the application.",
        control: { type: "select", options: fontOptions, appearance: "toggle" },
      },
      {
        id: "roundness",
        key: "ROUNDNESS",
        atom: roundnessAtom,
        title: "Roundness",
        description: "Adjust the corner radius of UI elements.",
        control: { type: "select", options: roundnessOptions, appearance: "toggle" },
      },
      {
        id: "text-scale",
        key: "TEXT_SCALE",
        atom: textScaleAtom,
        title: "Text Scale",
        description: "Adjust the text size throughout the application.",
        control: {
          type: "select",
          options: labels(TEXT_SCALE_OPTIONS, {
            xs: "Tiny",
            sm: "Small",
            md: "Default",
            lg: "Large",
            xl: "Huge",
            "2xl": "Gigantic",
          }),
        },
      },
    ],
  },
  {
    id: "chat-appearance",
    title: "Chat Appearance",
    section: "appearance",
    settings: [
      {
        id: "markdown-highlighting",
        key: "MARKDOWN_HIGHLIGHTING",
        atom: markdownHighlightingAtom,
        title: "Markdown Highlighting",
        description: "Show markdown formatting styles while typing in the chat input.",
        control: { type: "switch" },
      },
      {
        id: "input-style",
        key: "INPUT_STYLE",
        atom: inputStyleAtom,
        title: "Input Style",
        description: "Choose how the chat input box is displayed.",
        control: {
          type: "select",
          options: labels(INPUT_STYLE_OPTIONS, { docked: "Docked", floating: "Floating" }),
        },
      },
      {
        id: "collapsed-sidebar-layout",
        key: "COLLAPSED_SIDEBAR_LAYOUT",
        atom: collapsedSidebarLayoutAtom,
        title: "Collapsed Sidebar Layout",
        description: "Choose whether collapsed sidebar buttons are laid out in a row or column.",
        control: {
          type: "select",
          options: labels(COLLAPSED_SIDEBAR_LAYOUT_OPTIONS, { row: "Row", column: "Column" }),
        },
      },
    ],
  },
  {
    id: "chat-background",
    title: "Chat Background",
    section: "appearance",
    settings: [
      {
        id: "chat-background",
        key: "CHAT_BACKGROUND",
        atom: chatBackgroundAtom,
        title: "Background Image",
        description: "Pick a preset or add your own image behind the main chat area.",
        keywords: ["wallpaper", "image", "preset"],
        control: { type: "custom", componentId: "chat-background" },
      },
      {
        id: "chat-background-effects",
        key: "CHAT_BACKGROUND",
        atom: chatBackgroundAtom,
        title: "Background Effects",
        description: "Adjust the opacity, blur, dimming, scale, and position of the background.",
        control: { type: "custom", componentId: "chat-background-effects" },
      },
      {
        id: "chat-background-overlay",
        key: "CHAT_BACKGROUND",
        atom: chatBackgroundAtom,
        title: "Chat Background Shade",
        description:
          "Places a shade over the background image on chat pages to improve text readability when a chat is open.",
        control: { type: "custom", componentId: "chat-background-overlay" },
      },
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    section: "keyboard-shortcuts",
    componentId: "keyboard-shortcuts",
    settings: [
      {
        id: "activate-shortcuts-in-input-fields",
        key: "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS",
        atom: keyboardShortcutsEnabledInInputsAtom,
        title: "Activate shortcuts in input fields",
        description:
          "This is the default behavior. You can change it for individual shortcuts in the shortcut editor.",
        keywords: ["hotkeys", "keys"],
        control: { type: "switch" },
      },
    ],
  },
  {
    id: "chat-behavior",
    title: "Chat Behavior",
    section: "chats",
    settings: [
      {
        id: "chat-sort-order",
        key: "CHAT_SORT",
        atom: chatSortAtom,
        title: "Chat Sort Order",
        description:
          "Choose whether the sidebar keeps newer chats first or brings recently updated chats to the top.",
        control: {
          type: "select",
          options: labels(CHAT_SORT_OPTIONS, {
            "created-at": "Newest chats first",
            "updated-at": "Recently updated first",
          }),
        },
      },
      {
        id: "sidebar-chat-time-grouping",
        key: "SIDEBAR_CHAT_TIME_GROUPING",
        atom: sidebarChatTimeGroupingAtom,
        title: "Group sidebar chats by time",
        description:
          "Organize chats into time sections such as Recent, Last Week, and monthly groups.",
        control: {
          type: "select",
          options: labels(SIDEBAR_CHAT_TIME_GROUPING_OPTIONS, {
            "only-when-searching": "Only when searching",
            always: "Always",
            never: "Never",
          }),
        },
      },
      {
        id: "markdown-rendering",
        key: "MARKDOWN_RENDERING",
        atom: markdownRenderingAtom,
        title: "Markdown Rendering",
        description: "Choose which messages should render markdown formatting.",
        control: {
          type: "select",
          options: labels(MARKDOWN_RENDERING_OPTIONS, {
            both: "All messages",
            user: "User messages only",
            assistant: "Assistant messages only",
            neither: "No messages",
          }),
        },
      },
      {
        id: "remend",
        key: "REMEND_ENABLED",
        atom: remendEnabledAtom,
        title: "Fix Streaming Markdown",
        description: "Automatically fix incomplete formatting in streamed responses.",
        control: { type: "switch" },
      },
      {
        id: "completion-notification",
        key: "NOTIFICATION_SETTING",
        atom: notificationSettingAtom,
        title: "Agent Notifications",
        description: "Show a notification when AgentOne responds or needs your attention.",
        control: {
          type: "select",
          options: labels(NOTIFICATION_SETTING_OPTIONS, {
            always: "Always",
            "when-unfocused": "When window unfocused",
            never: "Never",
          }),
        },
      },
      {
        id: "message-action-row",
        key: "SHOW_MESSAGE_ACTION_ROW",
        atom: showMessageActionRowAtom,
        title: "Message Action Row",
        description: "Control when message actions (copy, edit, etc.) are visible.",
        control: {
          type: "select",
          options: labels(SHOW_MESSAGE_ACTION_ROW_OPTIONS, {
            hover: "Show on hover",
            always: "Always show",
            never: "Never show",
          }),
        },
      },
      {
        id: "submit-key",
        key: "SUBMIT_KEY",
        atom: submitKeyAtom,
        title: "Submit Key",
        description: "Choose which key combination submits your message.",
        keywords: ["enter", "send"],
        control: {
          type: "select",
          options: labels(SUBMIT_KEY_OPTIONS, {
            enter: "Enter",
            "ctrl-enter": "Ctrl/CMD + Enter",
          }),
        },
      },
      {
        id: "regenerate-on-save",
        key: "REGENERATE_ON_SAVE",
        atom: regenerateOnSaveAtom,
        title: "Regenerate on Save",
        description: "Automatically regenerate the AI response when you save an edited message.",
        control: { type: "switch" },
      },
      {
        id: "always-show-stop-button",
        key: "STOP_BUTTON_BEHAVIOR",
        atom: stopButtonBehaviorAtom,
        title: "Stop Button Behavior",
        description: "Choose when the stop button appears after you submit a message.",
        control: {
          type: "select",
          options: labels(STOP_BUTTON_BEHAVIOR_OPTIONS, {
            "at-stopping-point": "At stopping point",
            immediate: "Immediately",
          }),
          appearance: "toggle",
        },
      },
      {
        id: "show-scroll-to-bottom-button",
        key: "SHOW_CHAT_TO_BOTTOM_BUTTON",
        atom: showChatToBottomButtonAtom,
        title: "Chat Scroll to Bottom Button",
        description: "Show a button to quickly scroll to the bottom of the chat.",
        control: { type: "switch" },
      },
      {
        id: "show-message-preview-rail",
        key: "SHOW_MESSAGE_PREVIEW_RAIL",
        atom: showMessagePreviewRailAtom,
        title: "Message Navigation Rail",
        description:
          "Show message previews and navigation on the right side of chats. Hidden in the compact layout.",
        control: { type: "switch" },
      },
      {
        id: "chat-status-indicators",
        key: "SHOW_CHAT_STATUS_INDICATOR",
        atom: showChatStatusIndicatorAtom,
        title: "Chat Status Indicators",
        description: "Show status icons in the sidebar for loading, error, and unread chats.",
        control: { type: "switch" },
      },
    ],
  },
  {
    id: "streaming",
    title: "Streaming Experience",
    section: "streaming",
    settings: [
      {
        id: "smooth-stream",
        key: "SMOOTH_STREAM_ENABLED",
        atom: smoothStreamEnabledAtom,
        title: "Smooth Stream",
        description: "Enable smooth streaming for a more fluid typing experience.",
        control: { type: "switch" },
      },
      {
        id: "extract-reasoning",
        key: "EXTRACT_REASONING_ENABLED",
        atom: extractReasoningEnabledAtom,
        title: "Extract Reasoning from Think Tags",
        description:
          "Automatically extract <think> tag content from model responses and display it as a collapsible reasoning section. Does not apply to past messages or non-reasoning models.",
        control: { type: "switch" },
      },
      {
        id: "experimental-throttle",
        key: "EXPERIMENTAL_THROTTLE_ENABLED",
        atom: experimentalThrottleEnabledAtom,
        title: "Experimental Throttle",
        description: "Enable throttling to control streaming speed.",
        keywords: ["throttle", "speed"],
        control: { type: "switch" },
      },
      {
        id: "throttle-value",
        key: "EXPERIMENTAL_THROTTLE_VALUE",
        atom: experimentalThrottleValueAtom,
        title: "Throttle Value",
        description: "Adjust the throttle delay from 0ms to 10,000ms.",
        control: { type: "slider", min: 0, max: 10000, step: 10, unit: "ms" },
        visibleWhen: { atom: experimentalThrottleEnabledAtom },
      },
    ],
  },
  {
    id: "chat-titles",
    title: "Chat Titles",
    section: "chat-titles",
    resetKey: "TITLE_GENERATION",
    settings: [
      {
        id: "generation-method",
        key: "TITLE_GENERATION",
        path: ["method"],
        atom: titleGenerationAtom,
        title: "Generation Method",
        description: "How chat titles should be generated.",
        aiAccessible: false,
        control: {
          type: "select",
          options: [
            { value: "ai", label: "AI generated" },
            { value: "first-user-message", label: "First user message" },
            { value: "first-assistant-message", label: "First assistant message" },
            { value: "custom", label: "Custom phrase" },
          ],
        },
      },
      {
        id: "character-limit",
        key: "TITLE_GENERATION",
        path: ["characterLimit"],
        atom: titleGenerationAtom,
        title: "Character Limit",
        description: "Maximum characters to use from the message.",
        aiAccessible: false,
        control: { type: "number", min: 10, max: 200 },
        visibleWhen: {
          atom: titleGenerationAtom,
          path: ["method"],
          oneOf: ["first-user-message", "first-assistant-message"],
        },
      },
      {
        id: "title-max-output-tokens",
        key: "TITLE_GENERATION",
        path: ["maxOutputTokens"],
        atom: titleGenerationAtom,
        title: "Max Output Tokens",
        description:
          "Maximum tokens available for AI title generation. Use no limit if title generation fails with thinking models. Manually generated titles don't respect this setting.",
        aiAccessible: false,
        control: {
          type: "slider",
          min: 0,
          max: 64000,
          step: 64,
          minValue: "none",
          formatValue: (value) => (value === 0 ? "No limit" : value.toLocaleString()),
        },
        visibleWhen: { atom: titleGenerationAtom, path: ["method"], equals: "ai" },
      },
      {
        id: "custom-phrase",
        key: "TITLE_GENERATION",
        path: ["customPhrase"],
        atom: titleGenerationAtom,
        title: "Custom Phrase",
        description: "The phrase to use as the chat title.",
        aiAccessible: false,
        control: { type: "text", placeholder: "New chat" },
        visibleWhen: { atom: titleGenerationAtom, path: ["method"], equals: "custom" },
      },
      {
        id: "fallback-phrase",
        key: "TITLE_GENERATION",
        path: ["fallbackPhrase"],
        atom: titleGenerationAtom,
        title: "Fallback Phrase",
        description: "Used when title generation fails or no content is available.",
        aiAccessible: false,
        control: { type: "text", placeholder: "New chat" },
        visibleWhen: { atom: titleGenerationAtom, path: ["method"], notEquals: "custom" },
      },
    ],
  },
  {
    id: "rendering-limits",
    title: "Rendering Limits",
    section: "rendering-limits",
    settings: [
      {
        id: "max-message-length",
        key: "MAX_MESSAGE_LENGTH",
        atom: maxMessageLengthAtom,
        title: "Max Message Length",
        description: "Maximum characters before activating performance mode for that message.",
        control: { type: "number", min: 1000, max: 1000000 },
      },
      {
        id: "max-codeblock-characters",
        key: "MAX_CODEBLOCK_CHARS",
        atom: maxCodeblockCharsAtom,
        title: "Max Codeblock Characters",
        description: "Maximum characters in code blocks before switching to plain text rendering.",
        control: { type: "number", min: 1000, max: 1000000 },
      },
      {
        id: "max-tool-result-characters",
        key: "MAX_TOOL_RESULT_CHARS",
        atom: maxToolResultCharsAtom,
        title: "Max Tool Result Characters",
        description: "Maximum characters in tool results before switching to performant rendering.",
        control: { type: "number", min: 1000, max: 1000000 },
      },
    ],
  },
  {
    id: "chat-virtualization",
    title: "Chat Virtualization",
    section: "chat-virtualization",
    settings: [
      {
        id: "virtualize-chat-messages",
        key: "CHAT_VIRTUALIZATION_MODE",
        atom: chatVirtualizationModeAtom,
        title: "Virtualize Chat Messages",
        description:
          "Reduce rendering work for large chats while preserving the same chat UI behavior.",
        control: {
          type: "select",
          options: labels(CHAT_VIRTUALIZATION_MODE_OPTIONS, { off: "Off", threshold: "On" }),
          appearance: "toggle",
        },
      },
      {
        id: "message-count-threshold",
        key: "CHAT_VIRTUALIZATION_THRESHOLD",
        atom: chatVirtualizationThresholdAtom,
        title: "Message Count Threshold",
        description:
          "Only enable chat virtualization when a conversation reaches at least this many messages.",
        control: { type: "number", min: 1, max: 100000 },
        visibleWhen: { atom: chatVirtualizationModeAtom, notEquals: "off" },
      },
    ],
  },
  {
    id: "extension-runtime",
    title: "Extension Runtime",
    section: "extension-runtime",
    settings: [
      {
        id: "mcp-parallel-load-limit",
        key: "MCP_PARALLEL_LOAD_LIMIT",
        atom: mcpParallelLoadLimitAtom,
        title: "MCP Parallel Load Limit",
        description: "Maximum number of MCP servers loaded concurrently.",
        control: { type: "number", min: 1, max: 64 },
      },
    ],
  },
  {
    id: "built-in-providers",
    title: "Built-in Providers",
    description:
      "Enable built-in providers, set keys and headers, and override model metadata when needed.",
    section: "built-in-providers",
    anchor: "built-in-providers",
    componentId: "built-in-providers",
  },
  {
    id: "local-providers",
    title: "Local Providers",
    description:
      "Configure built-in local providers that can automatically discover models on startup.",
    section: "local-providers",
    anchor: "local-providers",
    componentId: "local-providers",
  },
  {
    id: "custom-providers",
    title: "Custom Providers",
    description: "Add OpenAI-compatible providers and configure exactly which models they expose.",
    section: "custom-providers",
    anchor: "custom-providers",
    componentId: "custom-providers",
  },
  {
    id: "text-to-speech",
    title: "Text-to-Speech Providers",
    description:
      "Choose which voice service reads assistant replies out loud and adjust how it sounds.",
    section: "text-to-speech",
    anchor: "tts-providers",
    componentId: "text-to-speech",
  },
  {
    id: "extensions",
    title: "Extensions",
    section: "extensions",
    componentId: "extensions",
    frameless: true,
    extraTargetIds: ["built-in-tools", "extensions-beta-notice", "extension-search-and-filters"],
  },
  {
    id: "app-updates",
    title: "App Updates",
    description: "Check for updates and read what changed.",
    section: "app-updates",
    componentId: "app-update",
  },
  {
    id: "model-updates",
    title: "Model List Updates",
    section: "model-updates",
    anchor: "model-directory",
    componentId: "model-directory",
  },
  {
    id: "help",
    title: "Help",
    description: "Report a bug, get help on Discord, or read the docs.",
    section: "help",
    componentId: "help",
  },
  {
    id: "usage-analytics",
    title: "Usage Analytics",
    section: "analytics",
    settings: [
      {
        id: "allow-usage-analytics",
        key: "ANALYTICS_IDENTITY",
        atom: analyticsIdentityAtom,
        title: "Allow usage analytics",
        description:
          "When disabled, AgentOne stops sending Google Analytics events from the desktop app.",
        control: {
          type: "select",
          options: labels(ANALYTICS_IDENTITY_OPTIONS, {
            off: "Off",
            anonymous: "Anonymous",
            "user-id": "Associate with my signed-in account",
          }),
          componentId: "analytics-enabled",
        },
      },
      {
        id: "associate-analytics-with-my-signed-in-account",
        key: "ANALYTICS_IDENTITY",
        atom: analyticsIdentityAtom,
        title: "Associate analytics with my signed-in account",
        description:
          "When enabled, AgentOne sends your internal account ID to GA4 as a User-ID so you can measure signed-in usage across sessions. We do not send your name or email address to Google Analytics.",
        docs: "https://www.agent-one.dev/privacy?utm_source=desktop-app",
        keywords: ["privacy", "tracking"],
        control: { type: "custom", componentId: "analytics-identity", layout: "inline" },
        aiAccessible: false,
      },
    ],
  },
  {
    id: "debug",
    title: "Debug",
    description: "Internal testing tools and utilities.",
    section: "debug",
    componentId: "debug-tools",
  },
] satisfies readonly SettingGroupDefinition[];

export interface ResolvedSetting {
  definition: SettingDefinition;
  group: SettingGroupDefinition;
  section: SettingSectionId;
}

const resolvedSettings: readonly ResolvedSetting[] = settingGroups.flatMap((group) =>
  (group.settings ?? []).map((definition) => ({
    definition,
    group,
    section: group.section,
  })),
);

const settingById = new Map(resolvedSettings.map((setting) => [setting.definition.id, setting]));
const settingByKey = new Map<string, ResolvedSetting>();
for (const setting of resolvedSettings) {
  const { key } = setting.definition;
  if (key && !settingByKey.has(key) && !setting.definition.path) {
    settingByKey.set(key, setting);
  }
}

/** Resolves a setting by its id (`theme`) or its settings key (`THEME`), ignoring a `setting-` prefix. */
export function getSettingDefinition(idOrKey: string): ResolvedSetting | undefined {
  const id = idOrKey.replace(/^setting-/, "");
  return settingById.get(id) ?? settingByKey.get(idOrKey);
}

export function getSettingsGroup(id: string): SettingGroupDefinition | undefined {
  return settingGroups.find((group) => group.id === id);
}

export function getGroupsForSection(section: SettingSectionId): readonly SettingGroupDefinition[] {
  return settingGroups.filter((group) => group.section === section);
}

export function getSection(id: string): SettingsSectionDefinition | undefined {
  return sections.find((section) => section.id === id);
}

/**
 * Section ids used by older versions of the app. Kept so `?tab=` links from release
 * notes, docs, and synced state keep working.
 */
const legacySectionIds: Record<string, SettingSectionId> = {
  performance: "rendering-limits",
  about: "app-updates",
  providers: "built-in-providers",
  "chat-background": "appearance",
  "chat-appearance": "appearance",
};

export function resolveSectionId(value: string): SettingSectionId | undefined {
  return getSection(value)?.id ?? legacySectionIds[value];
}

export function isSectionVisible(section: SettingSectionId, debugModeEnabled: boolean): boolean {
  const definition = getSection(section);
  if (!definition) return false;
  return !definition.requiresDebugMode || debugModeEnabled;
}

const sectionByTargetId = new Map<string, SettingSectionId>();
for (const group of settingGroups) {
  if (group.anchor) sectionByTargetId.set(group.anchor, group.section);
  for (const id of group.extraTargetIds ?? []) sectionByTargetId.set(id, group.section);
  for (const setting of group.settings ?? []) sectionByTargetId.set(setting.id, group.section);
}

/** Resolves a `#setting-...` anchor to the section that renders it. */
export function resolveSectionForTarget(targetId: string): SettingSectionId | undefined {
  return sectionByTargetId.get(targetId.replace(/^setting-/, ""));
}

export function getSettingDefaultValue(setting: SettingDefinition): unknown {
  if (!setting.key) return undefined;
  const defaultValue = DEFAULT_SETTINGS[setting.key];
  return setting.path ? getValueAtPath(defaultValue, setting.path) : defaultValue;
}

export function isAiAccessible(setting: SettingDefinition): boolean {
  if (setting.aiAccessible !== undefined) return setting.aiAccessible;
  return Boolean(setting.key && setting.atom && !setting.path && setting.control.type !== "custom");
}

export function getAiSettings(): readonly ResolvedSetting[] {
  return resolvedSettings.filter(({ definition }) => isAiAccessible(definition));
}

export function validateSettingValue(setting: SettingDefinition, value: unknown): string | null {
  const { control } = setting;

  switch (control.type) {
    case "switch":
      return typeof value === "boolean"
        ? null
        : `Expected type boolean, but received ${typeof value}`;
    case "select":
      return control.options.some((option) => option.value === value)
        ? null
        : `Value ${JSON.stringify(value)} is not valid. Valid options are: ${control.options
            .map((option) => JSON.stringify(option.value))
            .join(", ")}`;
    case "slider":
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return `Expected type number, but received ${typeof value}`;
      }
      const { min, max } = control;
      if (min !== undefined && value < min) {
        return `Value ${value} is below the minimum of ${min}`;
      }
      if (max !== undefined && value > max) {
        return `Value ${value} is above the maximum of ${max}`;
      }
      if (control.type === "number" && !Number.isInteger(value)) {
        return `Expected a whole number, but received ${value}`;
      }
      return null;
    }
    case "text": {
      if (typeof value !== "string") {
        return `Expected type string, but received ${typeof value}`;
      }
      if (control.maxLength !== undefined && value.length > control.maxLength) {
        return `Value is longer than the maximum of ${control.maxLength} characters`;
      }
      return null;
    }
    case "custom":
      return "This setting cannot be changed with the updateSetting tool.";
  }
}

/** Reads a (possibly nested) value out of a setting's stored value. */
export function getValueAtPath(value: unknown, path: readonly (string | number)[]): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string | number, unknown>)[segment];
  }, value);
}

/** Writes a (possibly nested) value, returning the updated parent object. */
export function setValueAtPath(
  value: unknown,
  path: readonly (string | number)[],
  next: unknown,
): unknown {
  if (path.length === 0) return next;

  const [segment, ...rest] = path;
  const base = value != null && typeof value === "object" ? value : {};
  const current = (base as Record<string | number, unknown>)[segment];

  return {
    ...(base as Record<string | number, unknown>),
    [segment]: setValueAtPath(current, rest, next),
  };
}

/** Which option of a select is currently selected, or undefined. */
export function getSelectedOption(
  control: Extract<SettingControl, { type: "select" }>,
  value: unknown,
): SettingSelectOption | undefined {
  return control.options.find((option) => option.value === value);
}
