import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";
import type { ToolConfigs, ToolId } from "@/lib/settings/types";

export const ALWAYS_ENABLED_TOOLS: ToolId[] = ["dateTime", "waitNumberMilliseconds"];

export const APPROVAL_FREE_TOOLS: ToolId[] = [
  "dateTime",
  "waitNumberMilliseconds",
  "getUrlContent",
  "webSearch",
  "wikipedia",
  "memory",
  "viewFile",
  "subAgent",
  "listSettings",
  "getSetting",
  "listScheduledAgents",
  "searchChats",
  "readChat",
];

export function getMergedEnabledTools(enabledTools: Partial<Record<ToolId, boolean>>) {
  const merged = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools };
  for (const toolId of ALWAYS_ENABLED_TOOLS) merged[toolId] = true;
  return merged;
}

export function getMergedToolConfigs(toolConfigs: Partial<ToolConfigs>): ToolConfigs {
  const merged = Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS.TOOL_CONFIGS).map(([toolId, defaults]) => [
      toolId,
      { ...defaults, ...toolConfigs[toolId as ToolId] },
    ]),
  ) as ToolConfigs;
  for (const toolId of APPROVAL_FREE_TOOLS) merged[toolId].requiresApproval = false;
  return merged;
}
