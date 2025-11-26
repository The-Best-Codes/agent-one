export type MarkdownRenderingOption = "user" | "assistant" | "both" | "neither";
export type SubmitKeyOption = "enter" | "ctrl-enter";
export type ThemeOption = "light" | "dark" | "system";
export type ColorThemeOption = "default" | "red" | "blue" | "yellow";
export type RoundnessOption = "none" | "sm" | "md" | "lg";
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
  NOTIFICATION_SETTING: NotificationOption;
  ENABLED_TOOLS: Record<ToolId, boolean>;
  MCP_SERVERS: McpServerConfig[];
  MCP_PARALLEL_LOAD_LIMIT: number;
  USER_NAME: string;
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  GROQ_API_KEY: string;
  OPENROUTER_API_KEY: string;
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
  GOOGLE_GENERATIVE_AI_API_KEY: "",
  GROQ_API_KEY: "",
  OPENROUTER_API_KEY: "",
};
