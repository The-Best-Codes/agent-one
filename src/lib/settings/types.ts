export type MarkdownRenderingOption = "user" | "assistant" | "both" | "neither";
export type SubmitKeyOption = "enter" | "ctrl-enter";
export type ThemeOption = "light" | "dark" | "system";
export type RoundnessOption = "none" | "sm" | "md" | "lg";
export type NotificationOption = "always" | "when-unfocused" | "never";

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
  EXPERIMENTAL_THROTTLE_ENABLED: boolean;
  EXPERIMENTAL_THROTTLE_VALUE: number;
  SMOOTH_STREAM_ENABLED: boolean;
  REGENERATE_ON_SAVE: boolean;
  THEME: ThemeOption;
  ROUNDNESS: RoundnessOption;
  NOTIFICATION_SETTING: NotificationOption;
  ENABLED_TOOLS: Record<ToolId, boolean>;
  MCP_SERVERS: McpServerConfig[];
  MCP_PARALLEL_LOAD_LIMIT: number;
}

export const DEFAULT_SETTINGS: DefaultSettings = {
  MARKDOWN_HIGHLIGHTING: true,
  MARKDOWN_RENDERING: "both",
  SUBMIT_KEY: "enter",
  MAX_CODEBLOCK_CHARS: 10000,
  MAX_MESSAGE_LENGTH: 50000,
  EXPERIMENTAL_THROTTLE_ENABLED: true,
  EXPERIMENTAL_THROTTLE_VALUE: 250,
  SMOOTH_STREAM_ENABLED: false,
  REGENERATE_ON_SAVE: false,
  THEME: "system",
  ROUNDNESS: "md",
  NOTIFICATION_SETTING: "when-unfocused",
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
};
