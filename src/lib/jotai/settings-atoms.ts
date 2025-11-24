import { atomWithStorage } from "jotai/utils";

import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type McpServerConfig,
  type NotificationOption,
  type RoundnessOption,
  type SubmitKeyOption,
  type ThemeOption,
  type ToolId,
} from "@/lib/settings/types";

import { lsJSONOrUndefined } from "./load-from-localstorage";

const SETTING_PREFIX = "agent-one-setting-";

const createSettingAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  const lsKey = `${SETTING_PREFIX}${key}`;
  return atomWithStorage<T>(lsKey, lsJSONOrUndefined<T>(lsKey) ?? defaultValue);
};

export const markdownHighlightingAtom = createSettingAtom(
  "MARKDOWN_HIGHLIGHTING",
  DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING,
);

export const markdownRenderingAtom = createSettingAtom<MarkdownRenderingOption>(
  "MARKDOWN_RENDERING",
  DEFAULT_SETTINGS.MARKDOWN_RENDERING,
);

export const submitKeyAtom = createSettingAtom<SubmitKeyOption>(
  "SUBMIT_KEY",
  DEFAULT_SETTINGS.SUBMIT_KEY,
);

export const maxCodeblockCharsAtom = createSettingAtom(
  "MAX_CODEBLOCK_CHARS",
  DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS,
);

export const maxMessageLengthAtom = createSettingAtom(
  "MAX_MESSAGE_LENGTH",
  DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH,
);

export const maxToolResultCharsAtom = createSettingAtom(
  "MAX_TOOL_RESULT_CHARS",
  DEFAULT_SETTINGS.MAX_TOOL_RESULT_CHARS,
);

export const experimentalThrottleEnabledAtom = createSettingAtom(
  "EXPERIMENTAL_THROTTLE_ENABLED",
  DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED,
);

export const experimentalThrottleValueAtom = createSettingAtom(
  "EXPERIMENTAL_THROTTLE_VALUE",
  DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE,
);

export const smoothStreamEnabledAtom = createSettingAtom(
  "SMOOTH_STREAM_ENABLED",
  DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED,
);

export const regenerateOnSaveAtom = createSettingAtom(
  "REGENERATE_ON_SAVE",
  DEFAULT_SETTINGS.REGENERATE_ON_SAVE,
);

export const themeAtom = createSettingAtom<ThemeOption>(
  "THEME",
  DEFAULT_SETTINGS.THEME,
);

export const roundnessAtom = createSettingAtom<RoundnessOption>(
  "ROUNDNESS",
  DEFAULT_SETTINGS.ROUNDNESS,
);

export const notificationSettingAtom = createSettingAtom<NotificationOption>(
  "NOTIFICATION_SETTING",
  DEFAULT_SETTINGS.NOTIFICATION_SETTING,
);

export const enabledToolsAtom = createSettingAtom<Record<ToolId, boolean>>(
  "ENABLED_TOOLS",
  DEFAULT_SETTINGS.ENABLED_TOOLS,
);

export const mcpServersAtom = createSettingAtom<McpServerConfig[]>(
  "MCP_SERVERS",
  DEFAULT_SETTINGS.MCP_SERVERS,
);

export const mcpParallelLoadLimitAtom = createSettingAtom(
  "MCP_PARALLEL_LOAD_LIMIT",
  DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT,
);

export const userNameAtom = createSettingAtom(
  "USER_NAME",
  DEFAULT_SETTINGS.USER_NAME,
);

export const googleGenerativeAiApiKeyAtom = createSettingAtom(
  "GOOGLE_GENERATIVE_AI_API_KEY",
  DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
);

export const groqApiKeyAtom = createSettingAtom(
  "GROQ_API_KEY",
  DEFAULT_SETTINGS.GROQ_API_KEY,
);

export const openrouterApiKeyAtom = createSettingAtom(
  "OPENROUTER_API_KEY",
  DEFAULT_SETTINGS.OPENROUTER_API_KEY,
);
