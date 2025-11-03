import { type ToolSet } from "ai";

import { DateTimeTool } from "./dateTime";
import { GetUrlContentTool } from "./getUrlContent";
import { WaitNumberMillisecondsTool } from "./waitNumberMilliseconds";
import { WebSearchTool } from "./webSearch";

export const staticTools: ToolSet = {
  dateTime: DateTimeTool,
  waitNumberMilliseconds: WaitNumberMillisecondsTool,
  getUrlContent: GetUrlContentTool,
  webSearch: WebSearchTool,
};
