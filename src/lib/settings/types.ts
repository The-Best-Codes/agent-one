// If you update this file, check if you also need to update reset-settings.ts in this directory

import type { ProviderStorageKey } from "@/lib/ai/providers/registry";

export type MarkdownRenderingOption = "user" | "assistant" | "both" | "neither";
export type SubmitKeyOption = "enter" | "ctrl-enter";
export type ThemeOption = "light" | "dark" | "system";
export type ColorThemeOption =
  | "default"
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "orange"
  | "rose"
  | "violet";
export type UiTintOption = ColorThemeOption;
export type UiTintStrengthOption = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type RoundnessOption = "none" | "sm" | "md" | "lg";
export type FontOption = "default" | "system" | "mono";
export type TextScaleOption = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type NotificationOption = "always" | "when-unfocused" | "never";
export type StopButtonBehaviorOption = "at-stopping-point" | "immediate";
export type MessageActionRowOption = "hover" | "always" | "never";
export type InputStyleOption = "docked" | "floating";
export type CollapsedSidebarLayoutOption = "row" | "column";
export type ChatVirtualizationModeOption = "off" | "threshold";

export type TitleGenerationMethodOption =
  | "ai"
  | "first-user-message"
  | "first-assistant-message"
  | "custom";

export interface TitleGenerationSettings {
  method: TitleGenerationMethodOption;
  characterLimit: number;
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
  | "editFile"
  | "createFile"
  | "deleteFile"
  | "viewFile"
  | "executeCommand";

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
}

export interface ToolConfigs {
  dateTime: DateTimeToolConfig;
  waitNumberMilliseconds: WaitToolConfig;
  getUrlContent: GetUrlContentToolConfig;
  webSearch: WebSearchToolConfig;
  editFile: EditFileToolConfig;
  createFile: CreateFileToolConfig;
  deleteFile: DeleteFileToolConfig;
  viewFile: ViewFileToolConfig;
  executeCommand: ExecuteCommandToolConfig;
}

type ApiKeySettings = Record<ProviderStorageKey, string>;

export interface DefaultSettings extends ApiKeySettings {
  MARKDOWN_HIGHLIGHTING: boolean;
  MARKDOWN_RENDERING: MarkdownRenderingOption;
  SUBMIT_KEY: SubmitKeyOption;
  INPUT_STYLE: InputStyleOption;
  MAX_CODEBLOCK_CHARS: number;
  MAX_MESSAGE_LENGTH: number;
  MAX_TOOL_RESULT_CHARS: number;
  CHAT_VIRTUALIZATION_MODE: ChatVirtualizationModeOption;
  CHAT_VIRTUALIZATION_THRESHOLD: number;
  EXPERIMENTAL_THROTTLE_ENABLED: boolean;
  EXPERIMENTAL_THROTTLE_VALUE: number;
  SMOOTH_STREAM_ENABLED: boolean;
  REGENERATE_ON_SAVE: boolean;
  STOP_BUTTON_BEHAVIOR: StopButtonBehaviorOption;
  SHOW_CHAT_STATUS_INDICATOR: boolean;
  SHOW_MESSAGE_ACTION_ROW: MessageActionRowOption;
  TITLE_GENERATION: TitleGenerationSettings;
  THEME: ThemeOption;
  COLOR_THEME: ColorThemeOption;
  UI_TINT: UiTintOption;
  UI_TINT_STRENGTH: UiTintStrengthOption;
  ROUNDNESS: RoundnessOption;
  FONT: FontOption;
  TEXT_SCALE: TextScaleOption;
  NOTIFICATION_SETTING: NotificationOption;
  ENABLED_TOOLS: Record<ToolId, boolean>;
  TOOL_CONFIGS: ToolConfigs;
  MCP_SERVERS: McpServerConfig[];
  MCP_PARALLEL_LOAD_LIMIT: number;
  USER_NAME: string;
  SYSTEM_PROMPT_APPENDIX: string;
  COLLAPSED_SIDEBAR_LAYOUT: CollapsedSidebarLayoutOption;
}

export const DEFAULT_SETTINGS: DefaultSettings = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
  SUBMIT_KEY: "enter",
  INPUT_STYLE: "docked",
  MAX_CODEBLOCK_CHARS: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_TOOL_RESULT_CHARS: 15000,
  CHAT_VIRTUALIZATION_MODE: "threshold",
  CHAT_VIRTUALIZATION_THRESHOLD: 100,
  EXPERIMENTAL_THROTTLE_ENABLED: true,
  EXPERIMENTAL_THROTTLE_VALUE: 250,
  SMOOTH_STREAM_ENABLED: false,
  REGENERATE_ON_SAVE: true,
  STOP_BUTTON_BEHAVIOR: "immediate",
  SHOW_CHAT_STATUS_INDICATOR: true,
  SHOW_MESSAGE_ACTION_ROW: "always",
  TITLE_GENERATION: {
    method: "ai",
    characterLimit: 50,
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
  ENABLED_TOOLS: {
    dateTime: true,
    waitNumberMilliseconds: true,
    getUrlContent: true,
    webSearch: true,
    editFile: true,
    createFile: true,
    deleteFile: true,
    viewFile: true,
    executeCommand: true,
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
    },
  },
  MCP_SERVERS: [],
  MCP_PARALLEL_LOAD_LIMIT: 8,
  USER_NAME: "",
  SYSTEM_PROMPT_APPENDIX: "",
  COLLAPSED_SIDEBAR_LAYOUT: "row",
  AGENT_ONE_API_KEY: "",
  "302AI_API_KEY": "",
  ABACUS_API_KEY: "",
  ABLIT_KEY: "",
  AIHUBMIX_API_KEY: "",
  DASHSCOPE_API_KEY: "",
  AVIAN_API_KEY: "",
  BASETEN_API_KEY: "",
  BERGET_API_KEY: "",
  CHUTES_API_KEY: "",
  CORTECS_API_KEY: "",
  OPENROUTER_API_KEY: "",
  GROQ_API_KEY: "",
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  CEREBRAS_API_KEY: "",
  OPENAI_API_KEY: "",
  ANTHROPIC_API_KEY: "",
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
  GITHUB_MODELS_TOKEN: "",
  HELICONE_API_KEY: "",
  HF_TOKEN: "",
  INCEPTION_API_KEY: "",
  IOINTELLIGENCE_API_KEY: "",
  JIEKOU_API_KEY: "",
  KILO_API_KEY: "",
  LLMGATEWAY_API_KEY: "",
  MOARK_API_KEY: "",
  MODELSCOPE_API_KEY: "",
  NANO_GPT_API_KEY: "",
  NOVITA_API_KEY: "",
  OVHCLOUD_API_KEY: "",
  POE_API_KEY: "",
  REQUESTY_API_KEY: "",
  SYNTHETIC_API_KEY: "",
  TARS_API_KEY: "",
  VENICE_API_KEY: "",
  AI_GATEWAY_API_KEY: "",
  WANDB_API_KEY: "",
  ZENMUX_API_KEY: "",
};
