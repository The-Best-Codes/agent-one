// The single source of truth for every synced setting: defaults, labels, options, and limits.
// Storage atoms, resets, the settings page, search, and the AI setting tools are all generated from this file.

import { defaultKeyboardShortcuts, type KeyboardShortcutSettings } from "@/lib/kbd-registry";

import type {
  ChatBackgroundSettings,
  TitleGenerationSettings,
  ToolConfigs,
  ToolId,
  TtsSettings,
} from "./types";

interface SettingText {
  label?: string;
  description?: string;
}

const select = <const O extends Record<string, string>>(
  definition: SettingText & { default: NoInfer<Extract<keyof O, string>>; options: O },
) => ({ control: "select" as const, ...definition });

const toggle = (definition: SettingText & { default: boolean }) => ({
  control: "switch" as const,
  ...definition,
});

const number = (definition: SettingText & { default: number; min: number; max: number }) => ({
  control: "number" as const,
  ...definition,
});

const slider = (
  definition: SettingText & {
    default: number;
    min: number;
    max: number;
    step: number;
    unit: string;
  },
) => ({ control: "slider" as const, ...definition });

const text = (
  definition: SettingText & {
    default: string;
    placeholder: string;
    maxLength?: number;
    multiline?: boolean;
  },
) => ({ control: "text" as const, ...definition });

const data = <T>(definition: SettingText & { default: T }) => ({
  control: "data" as const,
  ...definition,
});

const COLOR_OPTIONS = {
  default: "Default",
  amber: "Amber",
  blue: "Blue",
  cyan: "Cyan",
  emerald: "Emerald",
  fuchsia: "Fuchsia",
  green: "Green",
  indigo: "Indigo",
  lime: "Lime",
  orange: "Orange",
  pink: "Pink",
  purple: "Purple",
  red: "Red",
  rose: "Rose",
  sky: "Sky",
  teal: "Teal",
  violet: "Violet",
  yellow: "Yellow",
} as const;

const DEFAULT_TOOL_CONFIGS: ToolConfigs = {
  dateTime: { requiresApproval: false, useUtc: false },
  waitNumberMilliseconds: { requiresApproval: false, maxMs: 60000, minMs: 0 },
  getUrlContent: { requiresApproval: false, maxUrls: 10, minUrls: 1, defaultMaxLength: 5000 },
  webSearch: {
    requiresApproval: false,
    maxConcurrent: 3,
    defaultMaxResults: 20,
    defaultMaxPages: 2,
  },
  wikipedia: { requiresApproval: false, defaultMaxResults: 10 },
  memory: { requiresApproval: false },
  editFile: { requiresApproval: true },
  createFile: { requiresApproval: true },
  deleteFile: { requiresApproval: true },
  viewFile: { requiresApproval: false, defaultMaxChars: 10000 },
  executeCommand: { requiresApproval: true, defaultTimeoutMs: 120000, maxScrollbackChars: 25000 },
  subAgent: { requiresApproval: true },
  listSettings: { requiresApproval: false },
  getSetting: { requiresApproval: false },
  updateSetting: { requiresApproval: true },
  listScheduledAgents: { requiresApproval: false },
  createScheduledAgent: { requiresApproval: true },
  updateScheduledAgent: { requiresApproval: true },
  deleteScheduledAgent: { requiresApproval: true },
};

export const SETTINGS = {
  THEME: select({
    label: "Theme",
    default: "system",
    options: { system: "System", light: "Light", dark: "Dark" },
  }),
  COLOR_THEME: select({
    label: "Primary Color",
    description:
      "Controls the accent color used for switches, badges, highlights, and primary actions.",
    default: "default",
    options: COLOR_OPTIONS,
  }),
  UI_TINT: select({
    label: "Tint",
    description:
      "Adds a subtle color wash to surfaces like backgrounds, panels, sidebars, and muted buttons.",
    default: "default",
    options: COLOR_OPTIONS,
  }),
  UI_TINT_STRENGTH: slider({
    label: "Tint Strength",
    description: "Choose how light or strong the tint should feel.",
    default: 3,
    min: 1,
    max: 10,
    step: 1,
    unit: "/10",
  }),
  FONT: select({
    label: "Font",
    description: "Choose the font for the application.",
    default: "default",
    options: { default: "Default", system: "System", mono: "Mono", roboto: "Roboto" },
  }),
  ROUNDNESS: select({
    label: "Roundness",
    description: "Adjust the corner radius of UI elements.",
    default: "md",
    options: { none: "Not Round", sm: "Slightly Round", md: "Round", lg: "Very Round" },
  }),
  TEXT_SCALE: select({
    label: "Text Scale",
    description: "Adjust the text size throughout the application.",
    default: "md",
    options: {
      xs: "Tiny",
      sm: "Small",
      md: "Default",
      lg: "Large",
      xl: "Huge",
      "2xl": "Gigantic",
    },
  }),
  CHAT_BACKGROUND: data<ChatBackgroundSettings>({
    default: {
      preset: "none",
      customUrl: "",
      customUrls: [],
      customThumbnails: {},
      tint: 20,
      blur: 0,
      dim: 12,
      x: 50,
      y: 50,
      zoom: 100,
      backgroundShade: 55,
    },
  }),
  MARKDOWN_HIGHLIGHTING: toggle({
    label: "Markdown Highlighting",
    description: "Show markdown formatting styles while typing in the chat input.",
    default: true,
  }),
  INPUT_STYLE: select({
    label: "Input Style",
    description: "Choose how the chat input box is displayed.",
    default: "floating",
    options: { docked: "Docked", floating: "Floating" },
  }),
  COLLAPSED_SIDEBAR_LAYOUT: select({
    label: "Collapsed Sidebar Layout",
    description: "Choose whether collapsed sidebar buttons are laid out in a row or column.",
    default: "row",
    options: { row: "Row", column: "Column" },
  }),
  CHAT_SORT: select({
    label: "Chat Sort Order",
    description:
      "Sort by creation date, your latest sent message, or recent activity such as opening a chat or changing its settings.",
    default: "updated-at",
    options: {
      "created-at": "Newest chats first",
      "updated-at": "Recently messaged first",
      "active-at": "Recently active first",
    },
  }),
  SIDEBAR_CHAT_TIME_GROUPING: toggle({
    label: "Group sidebar chats by time",
    description: "Organize chats into time sections such as Recent, Last Week, and monthly groups.",
    default: false,
  }),
  MARKDOWN_RENDERING: select({
    label: "Markdown Rendering",
    description: "Choose which messages should render markdown formatting.",
    default: "both",
    options: {
      both: "All messages",
      user: "User messages only",
      assistant: "Assistant messages only",
      neither: "No messages",
    },
  }),
  REMEND_ENABLED: toggle({
    label: "Fix Streaming Markdown",
    description: "Automatically fix incomplete formatting in streamed responses.",
    default: true,
  }),
  NOTIFICATION_SETTING: select({
    label: "Agent Notifications",
    description: "Show a notification when AgentOne responds or needs your attention.",
    default: "when-unfocused",
    options: { always: "Always", "when-unfocused": "When window unfocused", never: "Never" },
  }),
  SHOW_MESSAGE_ACTION_ROW: select({
    label: "Message Action Row",
    description: "Control when message actions (copy, edit, etc.) are visible.",
    default: "always",
    options: { hover: "Show on hover", always: "Always show", never: "Never show" },
  }),
  SUBMIT_KEY: select({
    label: "Submit Key",
    description: "Choose which key combination submits your message.",
    default: "enter",
    options: { enter: "Enter", "ctrl-enter": "Ctrl/CMD + Enter" },
  }),
  INTERRUPT_KEY: select({
    label: "Interrupt Key",
    description: "Choose which key combination stops the response and sends your message.",
    default: "ctrl-enter",
    options: {
      enter: "Enter",
      "ctrl-enter": "Ctrl/CMD + Enter",
      "ctrl-shift-enter": "Ctrl/CMD + Shift + Enter",
    },
  }),
  REGENERATE_ON_SAVE: toggle({
    label: "Regenerate on Save",
    description: "Automatically regenerate the AI response when you save an edited message.",
    default: true,
  }),
  SHOW_CHAT_TO_BOTTOM_BUTTON: toggle({
    label: "Chat Scroll to Bottom Button",
    description: "Show a button to quickly scroll to the bottom of the chat.",
    default: true,
  }),
  SHOW_MESSAGE_PREVIEW_RAIL: toggle({
    label: "Message Navigation Rail",
    description:
      "Show message previews and navigation on the right side of chats. Hidden in the compact layout.",
    default: true,
  }),
  SHOW_CHAT_STATUS_INDICATOR: toggle({
    label: "Chat Status Indicators",
    description: "Show status icons in the sidebar for loading, error, and unread chats.",
    default: true,
  }),
  EXTRACT_REASONING_ENABLED: toggle({
    label: "Extract Reasoning from Think Tags",
    description:
      "Automatically extract <think> tag content from model responses and display it as a collapsible reasoning section. Does not apply to past messages or non-reasoning models.",
    default: false,
  }),
  THROTTLE_VALUE: slider({
    label: "Throttle",
    description: "Control how often streaming messages update the interface.",
    default: 100,
    min: 50,
    max: 1000,
    step: 10,
    unit: "ms",
  }),
  TITLE_GENERATION: data<TitleGenerationSettings>({
    default: {
      method: "ai",
      fallbackMethod: "first-user-message",
      characterLimit: 50,
      maxOutputTokens: 10240,
      customPhrase: "New chat",
      fallbackPhrase: "New chat",
    },
  }),
  TTS: data<TtsSettings>({
    default: {
      provider: "",
      openai: { model: "gpt-4o-mini-tts", voice: "alloy", speed: 1, instructions: "" },
      elevenlabs: {
        model: "eleven_v3",
        voice: "21m00Tcm4TlvDq8ikWAM",
        speed: 1,
        languageCode: "",
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: false,
        applyTextNormalization: "auto",
      },
      hume: {
        model: "default",
        voice: "d8ab67c6-953d-4bd8-9370-8fa53a0f1453",
        speed: 1,
        instructions: "",
      },
      google: { model: "gemini-3.8-flash-tts", voice: "Kore", speed: 1, instructions: "" },
    },
  }),
  MAX_MESSAGE_LENGTH: number({
    label: "Max Message Length",
    description: "Maximum characters before activating performance mode for that message.",
    default: 50000,
    min: 1000,
    max: 1000000,
  }),
  MAX_CODEBLOCK_CHARS: number({
    label: "Max Codeblock Characters",
    description: "Maximum characters in code blocks before switching to plain text rendering.",
    default: 10000,
    min: 1000,
    max: 1000000,
  }),
  MAX_TOOL_RESULT_CHARS: number({
    label: "Max Tool Result Characters",
    description: "Maximum characters in tool results before switching to performant rendering.",
    default: 15000,
    min: 1000,
    max: 1000000,
  }),
  CHAT_VIRTUALIZATION_MODE: select({
    label: "Virtualize Chat Messages",
    description:
      "Reduce rendering work for large chats while preserving the same chat UI behavior.",
    default: "threshold",
    options: { off: "Off", threshold: "On" },
  }),
  CHAT_VIRTUALIZATION_THRESHOLD: number({
    label: "Message Count Threshold",
    description:
      "Only enable chat virtualization when a conversation reaches at least this many messages.",
    default: 20,
    min: 1,
    max: 100000,
  }),
  MCP_PARALLEL_LOAD_LIMIT: number({
    label: "MCP Parallel Load Limit",
    description: "Maximum number of MCP servers loaded concurrently.",
    default: 8,
    min: 1,
    max: 64,
  }),
  USER_NAME: text({
    label: "Your Name",
    description: "AgentOne will use this name to address you.",
    default: "",
    placeholder: "Enter your name",
  }),
  SYSTEM_PROMPT_APPENDIX: text({
    label: "AI Instructions",
    description:
      "Add custom instructions that will be appended to the system prompt. These will guide how AgentOne responds to you.",
    default: "",
    placeholder: "e.g., Always use British English. Be concise and technical.",
    maxLength: 2000,
    multiline: true,
  }),
  MEMORY: data<string[]>({
    label: "Memory",
    description:
      "Save the things you want AgentOne to remember about you across chats, like your preferences, goals, or ongoing projects.",
    default: [],
  }),
  KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS: toggle({
    label: "Activate shortcuts in input fields",
    description:
      "This is the default behavior. You can change it for individual shortcuts in the shortcut editor.",
    default: true,
  }),
  KEYBOARD_SHORTCUTS: data<KeyboardShortcutSettings>({ default: defaultKeyboardShortcuts }),
  ENABLED_TOOLS: data<Record<ToolId, boolean>>({
    default: Object.fromEntries(
      Object.keys(DEFAULT_TOOL_CONFIGS).map((toolId) => [toolId, true]),
    ) as Record<ToolId, boolean>,
  }),
  TOOL_CONFIGS: data<ToolConfigs>({ default: DEFAULT_TOOL_CONFIGS }),
};

export type SettingKey = keyof typeof SETTINGS;
export type SettingDefinition = (typeof SETTINGS)[SettingKey];
export type SettingValue<K extends SettingKey> = (typeof SETTINGS)[K]["default"];
export type Settings = { [K in SettingKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

export const DEFAULT_SETTINGS = Object.fromEntries(
  SETTING_KEYS.map((key) => [key, SETTINGS[key].default]),
) as Settings;
