import { atom, type Atom } from "jotai";
import type { ComponentType } from "react";

import {
  AccountStatus,
  HideAgentOneModelsControl,
  MemoryControl,
  SyncControl,
} from "@/components/settings-components/account";
import {
  ColorThemeControl,
  FontControl,
  RoundnessControl,
  ThemeControl,
  TintControl,
} from "@/components/settings-components/appearance";
import {
  ChatBackgroundEffects,
  ChatBackgroundPicker,
  ChatBackgroundShade,
} from "@/components/settings-components/chat-background";
import {
  TitleCharacterLimitControl,
  TitleCustomPhrase,
  TitleFallbackMethodControl,
  TitleFallbackPhraseControl,
  TitleMaxOutputTokens,
  TitleMethodControl,
} from "@/components/settings-components/chat-titles";
import { VirtualizationControl } from "@/components/settings-components/chat-virtualization";
import {
  AppUpdates,
  DebugTools,
  ExtensionListUpdates,
  HelpLinks,
  ModelDirectoryUpdates,
} from "@/components/settings-components/help-and-updates";
import {
  OtherShortcutsAlert,
  ShortcutList,
} from "@/components/settings-components/keyboard-shortcuts";
import {
  BuiltInProviders,
  CustomProviders,
  LocalProviders,
  ProvidersIntro,
  TtsProviders,
} from "@/components/settings-components/providers/provider-cards";
import type { SettingsLayout } from "@/components/settings-components/setting-controls";
import { SandboxControl } from "@/components/settings-components/tools/sandbox";
import { ToolRow } from "@/components/settings-components/tools/tool-row";
import { ToolsIntro } from "@/components/settings-components/tools/tools-intro";
import { TOOL_GROUPS, TOOL_INFO } from "@/components/settings-components/tools/tools-metadata";
import { PROVIDER_REGISTRY } from "@/lib/ai/providers/registry";
import { TTS_PROVIDER_OPTIONS } from "@/lib/ai/tts";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { debugModeEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";
import { keyboardShortcutDefinitions } from "@/lib/kbd-registry";
import type { SettingKey } from "@/lib/settings/definitions";

const isVirtualizationEnabledAtom = atom(
  (get) => get(settingAtoms.CHAT_VIRTUALIZATION_MODE) !== "off",
);

const titleGenerationAtom = atom((get) => {
  const titleGeneration = get(settingAtoms.TITLE_GENERATION);
  return { ...titleGeneration, fallbackMethod: titleGeneration.fallbackMethod ?? "custom" };
});

const isAiTitleAtom = atom((get) => get(titleGenerationAtom).method === "ai");

const usesTitleLimitAtom = atom((get) => get(titleGenerationAtom).method !== "custom");

const usesCustomPhraseAtom = atom((get) => {
  const { method, fallbackMethod } = get(titleGenerationAtom);
  return method === "custom" || (method === "ai" && fallbackMethod === "custom");
});

const usesFallbackPhraseAtom = atom((get) => {
  const { method, fallbackMethod } = get(titleGenerationAtom);
  return method !== "custom" && (method !== "ai" || fallbackMethod !== "custom");
});

export interface SettingsSearchEntry {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
}

export interface SettingsItem {
  id: string;
  key?: SettingKey;
  label?: string;
  description?: string;
  keywords?: string[];
  layout?: SettingsLayout;
  control?: ComponentType;
  render?: ComponentType;
  visible?: Atom<boolean>;
  disabled?: Atom<boolean>;
  searchEntries?: SettingsSearchEntry[];
}

export interface SettingsCard {
  title?: string;
  description?: string;
  id?: string;
  keywords?: string[];
  size?: "default" | "sm";
  resetKey?: SettingKey;
  visible?: Atom<boolean>;
  items?: SettingsItem[];
  render?: ComponentType;
  searchEntries?: SettingsSearchEntry[];
}

export interface SettingsSection {
  id: string;
  label: string;
  searchPriority?: number;
  intro?: ComponentType;
  cards: SettingsCard[];
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "account",
    label: "Account",
    cards: [
      {
        title: "Sync & Access",
        items: [
          {
            id: "account",
            label: "Account",
            keywords: ["sign in", "sign out", "log in", "log out", "profile", "dashboard"],
            render: AccountStatus,
            searchEntries: [
              {
                id: "credits-used",
                label: "Credits used",
                keywords: ["plan", "billing", "subscription", "upgrade", "usage", "pro"],
              },
            ],
          },
          {
            id: "synchronize-my-settings",
            label: "Synchronize my settings",
            description: "Keep your settings in sync across devices using your AgentOne account.",
            keywords: ["sync", "devices", "cloud", "backup"],
            layout: "row",
            control: SyncControl,
          },
          {
            id: "hide-agentone-models",
            label: "Hide AgentOne models",
            description: "Remove AgentOne models from the model selector.",
            layout: "row",
            control: HideAgentOneModelsControl,
          },
        ],
      },
      {
        title: "Profile & Instructions",
        items: [
          { id: "your-name", key: "USER_NAME" },
          {
            id: "ai-instructions",
            key: "SYSTEM_PROMPT_APPENDIX",
          },
          { id: "memory", key: "MEMORY", layout: "stacked", control: MemoryControl },
        ],
      },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    cards: [
      {
        title: "General",
        items: [
          {
            id: "theme",
            key: "THEME",
            control: ThemeControl,
          },
          {
            id: "primary-color",
            key: "COLOR_THEME",
            control: ColorThemeControl,
          },
          { id: "tint", key: "UI_TINT", control: TintControl },
          {
            id: "tint-strength",
            key: "UI_TINT_STRENGTH",
            disabled: atom((get) => get(settingAtoms.UI_TINT) === "default"),
          },
          { id: "font", key: "FONT", control: FontControl },
          {
            id: "roundness",
            key: "ROUNDNESS",
            control: RoundnessControl,
          },
          { id: "text-scale", key: "TEXT_SCALE" },
        ],
      },
      {
        title: "Background",
        items: [
          {
            id: "chat-background",
            label: "Background Image",
            description: "Pick a preset or add your own image behind the main chat area.",
            keywords: ["wallpaper", "picture", "photo"],
            render: ChatBackgroundPicker,
          },
          {
            id: "chat-background-effects",
            label: "Background Effects",
            keywords: ["opacity", "blur", "dim", "position", "zoom", "wallpaper"],
            render: ChatBackgroundEffects,
          },
          {
            id: "chat-background-overlay",
            label: "Chat Background Shade",
            description:
              "Places a shade over the background image on chat pages to improve text readability when a chat is open.",
            keywords: ["overlay", "readability", "wallpaper"],
            layout: "stacked",
            control: ChatBackgroundShade,
          },
        ],
      },
      {
        title: "Chat",
        items: [
          { id: "markdown-highlighting", key: "MARKDOWN_HIGHLIGHTING" },
          { id: "input-style", key: "INPUT_STYLE" },
          { id: "collapsed-sidebar-layout", key: "COLLAPSED_SIDEBAR_LAYOUT" },
        ],
      },
    ],
  },
  {
    id: "chats",
    label: "Chats",
    cards: [
      {
        title: "Behavior",
        items: [
          { id: "chat-sort-order", key: "CHAT_SORT" },
          { id: "sidebar-chat-time-grouping", key: "SIDEBAR_CHAT_TIME_GROUPING" },
          { id: "markdown-rendering", key: "MARKDOWN_RENDERING" },
          { id: "remend", key: "REMEND_ENABLED" },
          { id: "completion-notification", key: "NOTIFICATION_SETTING" },
          { id: "message-action-row", key: "SHOW_MESSAGE_ACTION_ROW" },
          { id: "submit-key", key: "SUBMIT_KEY" },
          { id: "interrupt-key", key: "INTERRUPT_KEY" },
          { id: "regenerate-on-save", key: "REGENERATE_ON_SAVE" },
          { id: "show-scroll-to-bottom-button", key: "SHOW_CHAT_TO_BOTTOM_BUTTON" },
          { id: "show-message-preview-rail", key: "SHOW_MESSAGE_PREVIEW_RAIL" },
          { id: "chat-status-indicators", key: "SHOW_CHAT_STATUS_INDICATOR" },
        ],
      },
      {
        title: "Streaming",
        items: [
          { id: "extract-reasoning", key: "EXTRACT_REASONING_ENABLED" },
          { id: "throttle-value", key: "THROTTLE_VALUE" },
        ],
      },
      {
        title: "Titles",
        resetKey: "TITLE_GENERATION",
        items: [
          {
            id: "generation-method",
            label: "Generation Method",
            description: "How chat titles should be generated.",
            control: TitleMethodControl,
          },
          {
            id: "title-max-output-tokens",
            label: "Max Output Tokens",
            description: "Maximum tokens available for AI title generation.",
            render: TitleMaxOutputTokens,
            visible: isAiTitleAtom,
          },
          {
            id: "title-fallback-method",
            label: "Fallback Method",
            description: "Shown while the AI title is generating and kept if generation fails.",
            control: TitleFallbackMethodControl,
            visible: isAiTitleAtom,
          },
          {
            id: "character-limit",
            label: "Character Limit",
            description: "Maximum characters in generated titles and titles taken from messages.",
            control: TitleCharacterLimitControl,
            visible: usesTitleLimitAtom,
          },
          {
            id: "custom-phrase",
            label: "Custom Phrase",
            description: "The phrase to use as the chat title.",
            render: TitleCustomPhrase,
            visible: usesCustomPhraseAtom,
          },
          {
            id: "fallback-phrase",
            label: "Fallback Phrase",
            description: "Used when the selected message has no text.",
            control: TitleFallbackPhraseControl,
            visible: usesFallbackPhraseAtom,
          },
        ],
      },
    ],
  },
  {
    id: "keyboard-shortcuts",
    label: "Keyboard Shortcuts",
    searchPriority: 0.9,
    cards: [
      {
        items: [
          {
            id: "activate-shortcuts-in-input-fields",
            key: "KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS",
            layout: "responsive",
          },
          { id: "other-shortcuts", render: OtherShortcutsAlert },
          {
            id: "shortcuts",
            render: ShortcutList,
            searchEntries: keyboardShortcutDefinitions.map((definition) => ({
              id: `shortcut-${definition.id}`,
              label: definition.label,
              description: definition.description,
              keywords: ["keyboard shortcut", "hotkey"],
            })),
          },
        ],
      },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    cards: [
      {
        title: "Rendering Limits",
        items: [
          { id: "max-message-length", key: "MAX_MESSAGE_LENGTH" },
          { id: "max-codeblock-characters", key: "MAX_CODEBLOCK_CHARS" },
          { id: "max-tool-result-characters", key: "MAX_TOOL_RESULT_CHARS" },
        ],
      },
      {
        title: "Virtualization",
        items: [
          {
            id: "virtualize-chat-messages",
            key: "CHAT_VIRTUALIZATION_MODE",
            layout: "row",
            control: VirtualizationControl,
          },
          {
            id: "message-count-threshold",
            key: "CHAT_VIRTUALIZATION_THRESHOLD",
            visible: isVirtualizationEnabledAtom,
          },
        ],
      },
      {
        title: "Extensions",
        items: [{ id: "mcp-parallel-load-limit", key: "MCP_PARALLEL_LOAD_LIMIT" }],
      },
    ],
  },
  {
    id: "providers",
    label: "Providers",
    intro: ProvidersIntro,
    cards: [
      {
        id: "built-in-providers",
        title: "Built-in",
        description:
          "Enable built-in providers, set keys and headers, and override model metadata when needed.",
        keywords: ["providers", "api key", "models"],
        size: "sm",
        render: BuiltInProviders,
        searchEntries: PROVIDER_REGISTRY.filter((provider) => provider.id !== "agent-one").map(
          (provider) => ({
            id: "built-in-providers",
            label: provider.label,
            keywords: ["provider", "api key"],
          }),
        ),
      },
      {
        id: "local-providers",
        title: "Local",
        description:
          "Configure built-in local providers that can automatically discover models on startup.",
        keywords: ["providers", "ollama", "lm studio", "offline"],
        size: "sm",
        render: LocalProviders,
      },
      {
        id: "custom-providers",
        title: "Custom",
        description:
          "Add OpenAI-compatible providers and configure exactly which models they expose.",
        keywords: ["providers", "openai compatible", "base url", "api key"],
        size: "sm",
        render: CustomProviders,
      },
      {
        id: "tts-providers",
        title: "Text-to-Speech",
        description:
          "Choose which voice service reads assistant replies out loud and adjust how it sounds.",
        keywords: ["providers", "tts", "voice", "read aloud", "speech"],
        size: "sm",
        render: TtsProviders,
        searchEntries: TTS_PROVIDER_OPTIONS.map((provider) => ({
          id: "tts-providers",
          label: `${provider.label} Text-to-Speech`,
          keywords: ["tts", "voice"],
        })),
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    searchPriority: 0.8,
    intro: ToolsIntro,
    cards: [
      {
        title: "Sandbox",
        items: [
          {
            id: "sandbox",
            label: "Run tools in a sandbox",
            description:
              "Run the AI's commands and file changes in an isolated workspace instead of on your computer.",
            keywords: ["openshell", "nvidia", "isolation", "security", "safety", "docker"],
            render: SandboxControl,
          },
        ],
      },
      ...TOOL_GROUPS.map((group) => ({
        title: group.title,
        description: group.description,
        items: group.toolIds.map((toolId) => ({
          id: `tool-${TOOL_INFO[toolId].anchor}`,
          label: TOOL_INFO[toolId].name,
          description: TOOL_INFO[toolId].description,
          keywords: ["tool"],
          render: () => <ToolRow toolId={toolId} />,
        })),
      })),
    ],
  },
  {
    id: "about",
    label: "Help & Updates",
    cards: [
      {
        id: "app-updates",
        title: "App",
        keywords: ["updates", "version", "release notes", "changelog", "download", "install"],
        render: AppUpdates,
      },
      {
        id: "model-directory",
        title: "Model List",
        keywords: ["updates", "models", "refresh", "download"],
        render: ModelDirectoryUpdates,
      },
      {
        id: "extension-list",
        title: "Extension List",
        keywords: ["updates", "mcp", "extensions", "refresh", "download"],
        render: ExtensionListUpdates,
      },
      {
        id: "help",
        title: "Help",
        keywords: ["bug", "report", "discord", "docs", "support"],
        render: HelpLinks,
      },
      {
        id: "debug",
        title: "Debug",
        keywords: ["internal tests"],
        visible: debugModeEnabledAtom,
        render: DebugTools,
      },
    ],
  },
];

export function getCardAnchorId(sectionId: string, card: SettingsCard, index: number) {
  return card.id ? `setting-${card.id}` : `section-${sectionId}-card-${index}`;
}

export interface SettingsTocItem {
  id: string;
  title: string;
  depth: number;
  visible?: Atom<boolean>;
}

export const SETTINGS_TOC: SettingsTocItem[] = SETTINGS_SECTIONS.flatMap((section) => [
  { id: `section-${section.id}`, title: section.label, depth: 2 },
  ...section.cards.flatMap((card, index) =>
    card.title
      ? [
          {
            id: getCardAnchorId(section.id, card, index),
            title: card.title,
            depth: 3,
            visible: card.visible,
          },
        ]
      : [],
  ),
]);
