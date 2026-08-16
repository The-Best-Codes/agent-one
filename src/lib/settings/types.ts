// If you update this file, check if you also need to update reset-settings.ts in this directory
// Also check metadata.ts, which exposes the settings to the AI agent

import type { ProviderStorageKey } from "@/lib/ai/providers/registry";
import type { KeyboardShortcutSettings } from "@/lib/kbd-registry";
import { defaultKeyboardShortcuts } from "@/lib/kbd-registry";

export const MARKDOWN_RENDERING_OPTIONS = ["user", "assistant", "both", "neither"] as const;
export type MarkdownRenderingOption = (typeof MARKDOWN_RENDERING_OPTIONS)[number];

export const SUBMIT_KEY_OPTIONS = ["enter", "ctrl-enter"] as const;
export type SubmitKeyOption = (typeof SUBMIT_KEY_OPTIONS)[number];

export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export type ThemeOption = (typeof THEME_OPTIONS)[number];

export const COLOR_THEME_OPTIONS = [
  "default",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
] as const;
export type ColorThemeOption = (typeof COLOR_THEME_OPTIONS)[number];

export const UI_TINT_OPTIONS = [
  "default",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
] as const;
export type UiTintOption = (typeof UI_TINT_OPTIONS)[number];

export const UI_TINT_STRENGTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type UiTintStrengthOption = (typeof UI_TINT_STRENGTH_OPTIONS)[number];

export const ROUNDNESS_OPTIONS = ["none", "sm", "md", "lg"] as const;
export type RoundnessOption = (typeof ROUNDNESS_OPTIONS)[number];

export const FONT_OPTIONS = ["default", "system", "mono", "roboto"] as const;
export type FontOption = (typeof FONT_OPTIONS)[number];

export const TEXT_SCALE_OPTIONS = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type TextScaleOption = (typeof TEXT_SCALE_OPTIONS)[number];

export const NOTIFICATION_SETTING_OPTIONS = ["always", "when-unfocused", "never"] as const;
export type NotificationOption = (typeof NOTIFICATION_SETTING_OPTIONS)[number];

export const ANALYTICS_IDENTITY_OPTIONS = ["off", "anonymous", "user-id"] as const;
export type AnalyticsIdentityOption = (typeof ANALYTICS_IDENTITY_OPTIONS)[number];

export const STOP_BUTTON_BEHAVIOR_OPTIONS = ["at-stopping-point", "immediate"] as const;
export type StopButtonBehaviorOption = (typeof STOP_BUTTON_BEHAVIOR_OPTIONS)[number];

export const SHOW_MESSAGE_ACTION_ROW_OPTIONS = ["hover", "always", "never"] as const;
export type MessageActionRowOption = (typeof SHOW_MESSAGE_ACTION_ROW_OPTIONS)[number];

export const INPUT_STYLE_OPTIONS = ["docked", "floating"] as const;
export type InputStyleOption = (typeof INPUT_STYLE_OPTIONS)[number];

export const COLLAPSED_SIDEBAR_LAYOUT_OPTIONS = ["row", "column"] as const;
export type CollapsedSidebarLayoutOption = (typeof COLLAPSED_SIDEBAR_LAYOUT_OPTIONS)[number];

export const LANGUAGE_OPTIONS = ["en", "es", "fr", "ru"] as const;
export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

export const CHAT_VIRTUALIZATION_MODE_OPTIONS = ["off", "threshold"] as const;
export type ChatVirtualizationModeOption = (typeof CHAT_VIRTUALIZATION_MODE_OPTIONS)[number];

export const CHAT_SORT_OPTIONS = ["created-at", "updated-at"] as const;
export type ChatSortOption = (typeof CHAT_SORT_OPTIONS)[number];

export type ChatBackgroundPresetOption =
  | "none"
  | "custom"
  | "abstract"
  | "aurora"
  | "mist"
  | "forest"
  | "valley"
  | "ocean"
  | "mountain"
  | "sunset"
  | "night"
  | "island";
export type TtsProviderId = "openai" | "elevenlabs" | "lmnt" | "hume" | "google";

export interface ChatBackgroundSettings {
  preset: ChatBackgroundPresetOption;
  customUrl: string;
  customUrls: string[];
  customThumbnails: Record<string, string>;
  tint: number;
  blur: number;
  dim: number;
  x: number;
  y: number;
  zoom: number;
  backgroundShade: number;
}

export interface TtsOpenAISettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsElevenLabsSettings {
  model: string;
  voice: string;
  speed: number;
  languageCode: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  applyTextNormalization: "auto" | "on" | "off";
}

export interface TtsLmntSettings {
  model: string;
  voice: string;
  language: string;
  speed: number;
  conversational: boolean;
}

export interface TtsHumeSettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsGoogleSettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsSettings {
  provider: TtsProviderId | "";
  openai: TtsOpenAISettings;
  elevenlabs: TtsElevenLabsSettings;
  lmnt: TtsLmntSettings;
  hume: TtsHumeSettings;
  google: TtsGoogleSettings;
}

export type TitleGenerationMethodOption =
  | "ai"
  | "first-user-message"
  | "first-assistant-message"
  | "custom";

export interface TitleGenerationSettings {
  method: TitleGenerationMethodOption;
  characterLimit: number;
  maxOutputTokens: number | "none";
  customPhrase: string;
  fallbackPhrase: string;
}

export type McpServerType = "stdio" | "http";

export interface McpServerConfigBase {
  id: string;
  name: string;
  enabled: boolean;
  timeoutMs: number;
  requiresApproval: boolean;
  toolApprovalOverrides?: Record<string, boolean>;
}

export interface McpStdioServerConfig extends McpServerConfigBase {
  type: "stdio";
  command: string;
  env: Record<string, string>;
}

export interface McpHttpServerConfig extends McpServerConfigBase {
  type: "http";
  url: string;
  headers: Record<string, string>;
}

export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig;

export type ToolId =
  | "dateTime"
  | "waitNumberMilliseconds"
  | "getUrlContent"
  | "webSearch"
  | "wikipedia"
  | "memory"
  | "editFile"
  | "createFile"
  | "deleteFile"
  | "viewFile"
  | "executeCommand"
  | "subAgent"
  | "listSettings"
  | "getSetting"
  | "updateSetting";

export interface DateTimeToolConfig {
  requiresApproval: boolean;
  useUtc: boolean;
}

export interface WaitToolConfig {
  requiresApproval: boolean;
  maxMs: number;
  minMs: number;
}

export interface GetUrlContentToolConfig {
  requiresApproval: boolean;
  maxUrls: number;
  minUrls: number;
  defaultMaxLength: number;
}

export interface WebSearchToolConfig {
  requiresApproval: boolean;
  maxConcurrent: number;
  defaultMaxResults: number;
  defaultMaxPages: number;
}

export interface MemoryToolConfig {
  requiresApproval: boolean;
}

export interface EditFileToolConfig {
  requiresApproval: boolean;
}

export interface CreateFileToolConfig {
  requiresApproval: boolean;
}

export interface DeleteFileToolConfig {
  requiresApproval: boolean;
}

export interface ViewFileToolConfig {
  requiresApproval: boolean;
  defaultMaxChars: number;
}

export interface ExecuteCommandToolConfig {
  requiresApproval: boolean;
  defaultTimeoutMs: number;
  maxScrollbackChars: number;
}

export interface WikipediaToolConfig {
  requiresApproval: boolean;
  defaultMaxResults: number;
}

export interface SubAgentToolConfig {
  requiresApproval: boolean;
}

export interface ListSettingsToolConfig {
  requiresApproval: boolean;
}

export interface GetSettingToolConfig {
  requiresApproval: boolean;
}

export interface UpdateSettingToolConfig {
  requiresApproval: boolean;
}

export interface ToolConfigs {
  dateTime: DateTimeToolConfig;
  waitNumberMilliseconds: WaitToolConfig;
  getUrlContent: GetUrlContentToolConfig;
  webSearch: WebSearchToolConfig;
  wikipedia: WikipediaToolConfig;
  memory: MemoryToolConfig;
  editFile: EditFileToolConfig;
  createFile: CreateFileToolConfig;
  deleteFile: DeleteFileToolConfig;
  viewFile: ViewFileToolConfig;
  executeCommand: ExecuteCommandToolConfig;
  subAgent: SubAgentToolConfig;
  listSettings: ListSettingsToolConfig;
  getSetting: GetSettingToolConfig;
  updateSetting: UpdateSettingToolConfig;
}

type ApiKeySettings = Record<ProviderStorageKey, string>;

export interface DefaultSettings extends ApiKeySettings {
  MARKDOWN_HIGHLIGHTING: boolean;
  MARKDOWN_RENDERING: MarkdownRenderingOption;
  SUBMIT_KEY: SubmitKeyOption;
  INPUT_STYLE: InputStyleOption;
  LANGUAGE: LanguageOption;
  MAX_CODEBLOCK_CHARS: number;
  MAX_MESSAGE_LENGTH: number;
  MAX_TOOL_RESULT_CHARS: number;
  CHAT_VIRTUALIZATION_MODE: ChatVirtualizationModeOption;
  CHAT_VIRTUALIZATION_THRESHOLD: number;
  EXPERIMENTAL_THROTTLE_ENABLED: boolean;
  EXPERIMENTAL_THROTTLE_VALUE: number;
  SMOOTH_STREAM_ENABLED: boolean;
  EXTRACT_REASONING_ENABLED: boolean;
  REGENERATE_ON_SAVE: boolean;
  STOP_BUTTON_BEHAVIOR: StopButtonBehaviorOption;
  SHOW_CHAT_STATUS_INDICATOR: boolean;
  SHOW_MESSAGE_PREVIEW_RAIL: boolean;
  SHOW_MESSAGE_ACTION_ROW: MessageActionRowOption;
  CHAT_SORT: ChatSortOption;
  CHAT_BACKGROUND: ChatBackgroundSettings;
  TTS: TtsSettings;
  TITLE_GENERATION: TitleGenerationSettings;
  THEME: ThemeOption;
  COLOR_THEME: ColorThemeOption;
  UI_TINT: UiTintOption;
  UI_TINT_STRENGTH: UiTintStrengthOption;
  ROUNDNESS: RoundnessOption;
  FONT: FontOption;
  TEXT_SCALE: TextScaleOption;
  NOTIFICATION_SETTING: NotificationOption;
  ANALYTICS_IDENTITY: AnalyticsIdentityOption;
  ENABLED_TOOLS: Record<ToolId, boolean>;
  TOOL_CONFIGS: ToolConfigs;
  MCP_SERVERS: McpServerConfig[];
  MCP_PARALLEL_LOAD_LIMIT: number;
  USER_NAME: string;
  SYSTEM_PROMPT_APPENDIX: string;
  MEMORY: string[];
  COLLAPSED_SIDEBAR_LAYOUT: CollapsedSidebarLayoutOption;
  KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS: boolean;
  KEYBOARD_SHORTCUTS: KeyboardShortcutSettings;
  REMEND_ENABLED: boolean;
  SHOW_CHAT_TO_BOTTOM_BUTTON: boolean;
}

export const DEFAULT_SETTINGS: DefaultSettings = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
  SUBMIT_KEY: "enter",
  INPUT_STYLE: "docked",
  LANGUAGE: "en",
  MAX_CODEBLOCK_CHARS: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_TOOL_RESULT_CHARS: 15000,
  CHAT_VIRTUALIZATION_MODE: "threshold",
  CHAT_VIRTUALIZATION_THRESHOLD: 20,
  EXPERIMENTAL_THROTTLE_ENABLED: true,
  EXPERIMENTAL_THROTTLE_VALUE: 250,
  SMOOTH_STREAM_ENABLED: false,
  EXTRACT_REASONING_ENABLED: false,
  REGENERATE_ON_SAVE: true,
  STOP_BUTTON_BEHAVIOR: "immediate",
  SHOW_CHAT_STATUS_INDICATOR: true,
  SHOW_MESSAGE_PREVIEW_RAIL: true,
  SHOW_MESSAGE_ACTION_ROW: "always",
  CHAT_SORT: "created-at",
  CHAT_BACKGROUND: {
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
  TTS: {
    provider: "",
    openai: {
      model: "tts-1",
      voice: "alloy",
      speed: 1,
      instructions: "",
    },
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
    lmnt: {
      model: "aurora",
      voice: "ava",
      language: "en",
      speed: 1,
      conversational: false,
    },
    hume: {
      model: "default",
      voice: "d8ab67c6-953d-4bd8-9370-8fa53a0f1453",
      speed: 1,
      instructions: "",
    },
    google: {
      model: "gemini-3.1-flash-tts-preview",
      voice: "Kore",
      speed: 1,
      instructions: "",
    },
  },
  TITLE_GENERATION: {
    method: "ai",
    characterLimit: 50,
    maxOutputTokens: 1024,
    customPhrase: "New chat",
    fallbackPhrase: "New chat",
  },
  THEME: "system",
  COLOR_THEME: "default",
  UI_TINT: "default",
  UI_TINT_STRENGTH: 3,
  ROUNDNESS: "md",
  FONT: "default",
  TEXT_SCALE: "md",
  NOTIFICATION_SETTING: "never",
  ANALYTICS_IDENTITY: "user-id",
  ENABLED_TOOLS: {
    dateTime: true,
    waitNumberMilliseconds: true,
    getUrlContent: true,
    webSearch: true,
    wikipedia: true,
    memory: true,
    editFile: true,
    createFile: true,
    deleteFile: true,
    viewFile: true,
    executeCommand: true,
    subAgent: true,
    listSettings: true,
    getSetting: true,
    updateSetting: true,
  },
  TOOL_CONFIGS: {
    dateTime: {
      requiresApproval: false,
      useUtc: false,
    },
    waitNumberMilliseconds: {
      requiresApproval: false,
      maxMs: 60000,
      minMs: 0,
    },
    getUrlContent: {
      requiresApproval: false,
      maxUrls: 10,
      minUrls: 1,
      defaultMaxLength: 5000,
    },
    webSearch: {
      requiresApproval: false,
      maxConcurrent: 3,
      defaultMaxResults: 20,
      defaultMaxPages: 2,
    },
    wikipedia: {
      requiresApproval: false,
      defaultMaxResults: 10,
    },
    memory: {
      requiresApproval: false,
    },
    editFile: {
      requiresApproval: true,
    },
    createFile: {
      requiresApproval: true,
    },
    deleteFile: {
      requiresApproval: true,
    },
    viewFile: {
      requiresApproval: false,
      defaultMaxChars: 10000,
    },
    executeCommand: {
      requiresApproval: true,
      defaultTimeoutMs: 120000,
      maxScrollbackChars: 25000,
    },
    subAgent: {
      requiresApproval: true,
    },
    listSettings: {
      requiresApproval: false,
    },
    getSetting: {
      requiresApproval: false,
    },
    updateSetting: {
      requiresApproval: true,
    },
  },
  MCP_SERVERS: [],
  MCP_PARALLEL_LOAD_LIMIT: 8,
  USER_NAME: "",
  SYSTEM_PROMPT_APPENDIX: "",
  MEMORY: [],
  COLLAPSED_SIDEBAR_LAYOUT: "row",
  KEYBOARD_SHORTCUTS_ENABLED_IN_INPUTS: true,
  KEYBOARD_SHORTCUTS: defaultKeyboardShortcuts,
  REMEND_ENABLED: true,
  SHOW_CHAT_TO_BOTTOM_BUTTON: true,
  AGENT_ONE_API_KEY: "",
  "302AI_API_KEY": "",
  ABACUS_API_KEY: "",
  ABLIT_KEY: "",
  AIHUBMIX_API_KEY: "",
  DASHSCOPE_API_KEY: "",
  AMBIENT_API_KEY: "",
  AVIAN_API_KEY: "",
  BASETEN_API_KEY: "",
  BERGET_API_KEY: "",
  CHUTES_API_KEY: "",
  CORTECS_API_KEY: "",
  CROF_API_KEY: "",
  OPENROUTER_API_KEY: "",
  GROQ_API_KEY: "",
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  CEREBRAS_API_KEY: "",
  OPENAI_API_KEY: "",
  ANTHROPIC_API_KEY: "",
  API_AIRFORCE_API_KEY: "",
  MISTRAL_API_KEY: "",
  DEEPSEEK_API_KEY: "",
  XAI_API_KEY: "",
  COHERE_API_KEY: "",
  DEEPINFRA_API_KEY: "",
  FASTROUTER_API_KEY: "",
  PERPLEXITY_API_KEY: "",
  TOGETHERAI_API_KEY: "",
  FIREWORKS_API_KEY: "",
  FRIENDLI_TOKEN: "",
  GITHUB_TOKEN: "",
  HELICONE_API_KEY: "",
  HF_TOKEN: "",
  HYPER_API_KEY: "",
  INCEPTION_API_KEY: "",
  INCEPTRON_API_KEY: "",
  IOINTELLIGENCE_API_KEY: "",
  JIEKOU_API_KEY: "",
  KENARI_API_KEY: "",
  KILO_API_KEY: "",
  LLMGATEWAY_API_KEY: "",
  LLMTR_API_KEY: "",
  MOARK_API_KEY: "",
  MODELSCOPE_API_KEY: "",
  NANO_GPT_API_KEY: "",
  NEARAI_API_KEY: "",
  NEURALWATT_API_KEY: "",
  NOVITA_API_KEY: "",
  NVIDIA_API_KEY: "",
  OLLAMA_CLOUD_API_KEY: "",
  OPENCODE_ZEN_API_KEY: "",
  ORCAROUTER_API_KEY: "",
  OVHCLOUD_API_KEY: "",
  POE_API_KEY: "",
  QINIU_API_KEY: "",
  REQUESTY_API_KEY: "",
  ROUTING_RUN_API_KEY: "",
  SAKANA_API_KEY: "",
  SYNTHETIC_API_KEY: "",
  TARS_API_KEY: "",
  TOKENROUTER_API_KEY: "",
  VENICE_API_KEY: "",
  AI_GATEWAY_API_KEY: "",
  WAFER_AI_API_KEY: "",
  WANDB_API_KEY: "",
  XPERSONA_API_KEY: "",
  ZENMUX_API_KEY: "",
};
