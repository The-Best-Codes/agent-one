// If you update this file, check if you also need to update reset-settings.ts in this directory

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
export type RoundnessOption = "none" | "sm" | "md" | "lg";
export type FontOption = "default" | "system" | "mono";
export type TextScaleOption = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type NotificationOption = "always" | "when-unfocused" | "never";
export type StopButtonBehaviorOption = "at-stopping-point" | "immediate";

export interface McpServerConfig {
  id: string;
  name: string;
  command: string;
  enabled: boolean;
  timeoutMs: number;
}

export type ToolId =
  | "dateTime"
  | "waitNumberMilliseconds"
  | "getUrlContent"
  | "webSearch";

export interface DateTimeToolConfig {
  useUtc: boolean;
}

export interface WaitToolConfig {
  maxMs: number;
  minMs: number;
}

export interface WebSearchToolConfig {
  maxConcurrent: number;
  defaultMaxResults: number;
  defaultMaxPages: number;
  requiresApproval: boolean;
}

export interface GetUrlContentToolConfig {
  maxUrls: number;
  minUrls: number;
  requiresApproval: boolean;
}

export interface DefaultSettings {
  MARKDOWN_HIGHLIGHTING: boolean;
  MARKDOWN_RENDERING: MarkdownRenderingOption;
  SUBMIT_KEY: SubmitKeyOption;
  MAX_CODEBLOCK_CHARS: number;
  MAX_MESSAGE_LENGTH: number;
  MAX_TOOL_RESULT_CHARS: number;
  EXPERIMENTAL_THROTTLE_ENABLED: boolean;
  EXPERIMENTAL_THROTTLE_VALUE: number;
  SMOOTH_STREAM_ENABLED: boolean;
  REGENERATE_ON_SAVE: boolean;
  STOP_BUTTON_BEHAVIOR: StopButtonBehaviorOption;
  THEME: ThemeOption;
  COLOR_THEME: ColorThemeOption;
  ROUNDNESS: RoundnessOption;
  FONT: FontOption;
  TEXT_SCALE: TextScaleOption;
  NOTIFICATION_SETTING: NotificationOption;
  ENABLED_TOOLS: Record<ToolId, boolean>;
  MCP_SERVERS: McpServerConfig[];
  MCP_PARALLEL_LOAD_LIMIT: number;
  USER_NAME: string;
  SYSTEM_PROMPT_APPENDIX: string;
  DATE_TIME_TOOL_CONFIG: DateTimeToolConfig;
  WAIT_TOOL_CONFIG: WaitToolConfig;
  WEB_SEARCH_TOOL_CONFIG: WebSearchToolConfig;
  GET_URL_CONTENT_TOOL_CONFIG: GetUrlContentToolConfig;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  GROQ_API_KEY: string;
  OPENROUTER_API_KEY: string;
  CEREBRAS_API_KEY: string;
  OPENCODE_API_KEY: string;
}

export const DEFAULT_SETTINGS: DefaultSettings = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
  SUBMIT_KEY: "enter",
  MAX_CODEBLOCK_CHARS: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  MAX_TOOL_RESULT_CHARS: 15000,
  EXPERIMENTAL_THROTTLE_ENABLED: true,
  EXPERIMENTAL_THROTTLE_VALUE: 250,
  SMOOTH_STREAM_ENABLED: false,
  REGENERATE_ON_SAVE: false,
  STOP_BUTTON_BEHAVIOR: "immediate",
  THEME: "system",
  COLOR_THEME: "default",
  ROUNDNESS: "md",
  FONT: "default",
  TEXT_SCALE: "md",
  NOTIFICATION_SETTING: "never",
  ENABLED_TOOLS: {
    dateTime: true,
    waitNumberMilliseconds: true,
    getUrlContent: true,
    webSearch: true,
  },
  MCP_SERVERS: [
    {
      id: "everything",
      name: "Everything Server",
      command: "npx -y @modelcontextprotocol/server-everything",
      enabled: true,
      timeoutMs: 30000,
    },
  ],
  MCP_PARALLEL_LOAD_LIMIT: 8,
  USER_NAME: "",
  SYSTEM_PROMPT_APPENDIX: "",
  DATE_TIME_TOOL_CONFIG: {
    useUtc: false,
  },
  WAIT_TOOL_CONFIG: {
    maxMs: 60000,
    minMs: 0,
  },
  WEB_SEARCH_TOOL_CONFIG: {
    maxConcurrent: 5,
    defaultMaxResults: 20,
    defaultMaxPages: 1,
    requiresApproval: false,
  },
  GET_URL_CONTENT_TOOL_CONFIG: {
    maxUrls: 5,
    minUrls: 1,
    requiresApproval: false,
  },
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  GROQ_API_KEY: "",
  OPENROUTER_API_KEY: "",
  CEREBRAS_API_KEY: "",
  OPENCODE_API_KEY: "",
};
