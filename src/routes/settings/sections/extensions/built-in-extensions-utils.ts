import { useAtom } from "jotai";

import { enabledToolsAtom } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS, type ToolId } from "@/lib/settings/types";

export const BUILT_IN_TOOLS: Record<
  ToolId,
  {
    name: string;
    description: string;
    searchTerms: string;
    nameKey: string;
    descriptionKey: string;
  }
> = {
  dateTime: {
    name: "Current date and time",
    description: "Check the current date and time",
    searchTerms: "date time clock timezone",
    nameKey: "extensions.tools.dateTime.name",
    descriptionKey: "extensions.tools.dateTime.description",
  },
  waitNumberMilliseconds: {
    name: "Pause",
    description: "Wait for a short amount of time",
    searchTerms: "wait delay pause timer milliseconds",
    nameKey: "extensions.tools.waitNumberMilliseconds.name",
    descriptionKey: "extensions.tools.waitNumberMilliseconds.description",
  },
  getUrlContent: {
    name: "Browse",
    description: "Read content from web pages",
    searchTerms: "url website fetch read page",
    nameKey: "extensions.tools.getUrlContent.name",
    descriptionKey: "extensions.tools.getUrlContent.description",
  },
  webSearch: {
    name: "Search the web",
    description: "Find information online",
    searchTerms: "search web internet results",
    nameKey: "extensions.tools.webSearch.name",
    descriptionKey: "extensions.tools.webSearch.description",
  },
  wikipedia: {
    name: "Wikipedia",
    description: "Search Wikipedia and read article summaries, content, links, and categories",
    searchTerms: "wikipedia encyclopedia knowledge article reference",
    nameKey: "extensions.tools.wikipedia.name",
    descriptionKey: "extensions.tools.wikipedia.description",
  },
  memory: {
    name: "Memory",
    description: "Maintain concise long-term user memory",
    searchTerms: "memory remember preferences profile facts notes",
    nameKey: "extensions.tools.memory.name",
    descriptionKey: "extensions.tools.memory.description",
  },
  editFile: {
    name: "Edit file",
    description: "Edit files by replacing text content",
    searchTerms: "edit file modify change replace text",
    nameKey: "extensions.tools.editFile.name",
    descriptionKey: "extensions.tools.editFile.description",
  },
  createFile: {
    name: "Create file",
    description: "Create new files with content",
    searchTerms: "create file new write",
    nameKey: "extensions.tools.createFile.name",
    descriptionKey: "extensions.tools.createFile.description",
  },
  deleteFile: {
    name: "Delete file",
    description: "Delete files from the filesystem",
    searchTerms: "delete file remove",
    nameKey: "extensions.tools.deleteFile.name",
    descriptionKey: "extensions.tools.deleteFile.description",
  },
  viewFile: {
    name: "View file",
    description: "Read and view file contents with smart truncation",
    searchTerms: "view file read open content",
    nameKey: "extensions.tools.viewFile.name",
    descriptionKey: "extensions.tools.viewFile.description",
  },
  executeCommand: {
    name: "Run command",
    description: "Execute terminal commands on your system",
    searchTerms: "execute command terminal shell bash run script",
    nameKey: "extensions.tools.executeCommand.name",
    descriptionKey: "extensions.tools.executeCommand.description",
  },
  subAgent: {
    name: "Spawn subagent",
    description: "Delegate focused work to a streamed subagent",
    searchTerms: "subagent delegate nested agent parallel work",
    nameKey: "extensions.tools.subAgent.name",
    descriptionKey: "extensions.tools.subAgent.description",
  },
  listSettings: {
    name: "List Settings",
    description: "List all available configuration setting keys",
    searchTerms: "settings list keys config configuration options",
    nameKey: "extensions.tools.listSettings.name",
    descriptionKey: "extensions.tools.listSettings.description",
  },
  getSetting: {
    name: "Get Setting",
    description: "Get the current value and possible options of a specific setting",
    searchTerms: "settings get value options inspect configuration",
    nameKey: "extensions.tools.getSetting.name",
    descriptionKey: "extensions.tools.getSetting.description",
  },
  updateSetting: {
    name: "Update Setting",
    description: "Update a setting key's value",
    searchTerms: "settings update change set write value configuration",
    nameKey: "extensions.tools.updateSetting.name",
    descriptionKey: "extensions.tools.updateSetting.description",
  },
};

export const TOOL_IDS = Object.keys(BUILT_IN_TOOLS) as ToolId[];

export const BUILT_IN_SEARCH_TEXT = TOOL_IDS.map((id) => {
  const t = BUILT_IN_TOOLS[id];
  return `${t.name} ${t.description} ${t.searchTerms}`;
}).join(" ");

export function useEnabledToolCount(): number {
  const [enabledTools] = useAtom(enabledToolsAtom);
  const mergedEnabledTools = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools };
  return TOOL_IDS.filter((id) => mergedEnabledTools[id]).length;
}
