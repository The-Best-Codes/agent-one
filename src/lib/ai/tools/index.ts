import { type ToolSet } from "ai";

import { DEFAULT_SETTINGS } from "@/lib/settings/types";

import { createDateTimeTool } from "./dateTime";
import { createGetUrlContentTool } from "./getUrlContent";
import { createWaitNumberMillisecondsTool } from "./waitNumberMilliseconds";
import { createWebSearchTool } from "./webSearch";

export {
  createDateTimeTool,
  createGetUrlContentTool,
  createWaitNumberMillisecondsTool,
  createWebSearchTool,
};

export const createStaticTools = (configs: {
  dateTime: typeof DEFAULT_SETTINGS.DATE_TIME_TOOL_CONFIG;
  wait: typeof DEFAULT_SETTINGS.WAIT_TOOL_CONFIG;
  webSearch: typeof DEFAULT_SETTINGS.WEB_SEARCH_TOOL_CONFIG;
  getUrlContent: typeof DEFAULT_SETTINGS.GET_URL_CONTENT_TOOL_CONFIG;
}): ToolSet => ({
  dateTime: createDateTimeTool(configs.dateTime),
  waitNumberMilliseconds: createWaitNumberMillisecondsTool(configs.wait),
  getUrlContent: createGetUrlContentTool(configs.getUrlContent),
  webSearch: createWebSearchTool(configs.webSearch),
});
