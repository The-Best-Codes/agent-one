import { type ToolSet } from "ai";

import { getLogger } from "@/lib/logger";

import { DateTimeTool } from "./dateTime";
import { GetUrlContentTool } from "./getUrlContent";
import { getMcpTools } from "./mcp";
import { WaitNumberMillisecondsTool } from "./waitNumberMilliseconds";
import { WebSearchTool } from "./webSearch";

const logger = getLogger(import.meta.url);

export const staticTools: ToolSet = {
  dateTime: DateTimeTool,
  waitNumberMilliseconds: WaitNumberMillisecondsTool,
  getUrlContent: GetUrlContentTool,
  webSearch: WebSearchTool,
};

let allTools: ToolSet | null = null;

export async function getToolsObject(): Promise<ToolSet> {
  if (allTools) {
    return allTools;
  }

  try {
    logger.verbose("Fetching MCP tools...");
    const mcpTools = await getMcpTools();
    allTools = {
      ...staticTools,
      ...mcpTools,
    };
    logger.verbose("MCP and static tools loaded.");
    return allTools;
  } catch (error) {
    logger.error(
      "Failed to get MCP tools, falling back to static tools",
      error,
    );
    allTools = { ...staticTools };
    return allTools;
  }
}
