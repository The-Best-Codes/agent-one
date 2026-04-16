import { useAtom } from "jotai";

import { enabledToolsAtom } from "@/lib/jotai/settings-atoms";
import { type ToolId } from "@/lib/settings/types";

export const BUILT_IN_TOOLS: Record<
  ToolId,
  { name: string; description: string; searchTerms: string }
> = {
  dateTime: {
    name: "Current date and time",
    description: "Check the current date and time",
    searchTerms: "date time clock timezone",
  },
  waitNumberMilliseconds: {
    name: "Pause",
    description: "Wait for a short amount of time",
    searchTerms: "wait delay pause timer milliseconds",
  },
  getUrlContent: {
    name: "Browse",
    description: "Read content from web pages",
    searchTerms: "url website fetch read page",
  },
  webSearch: {
    name: "Search the web",
    description: "Find information online",
    searchTerms: "search web internet results",
  },
  editFile: {
    name: "Edit file",
    description: "Edit files by replacing text content",
    searchTerms: "edit file modify change replace text",
  },
  createFile: {
    name: "Create file",
    description: "Create new files with content",
    searchTerms: "create file new write",
  },
  deleteFile: {
    name: "Delete file",
    description: "Delete files from the filesystem",
    searchTerms: "delete file remove",
  },
  viewFile: {
    name: "View file",
    description: "Read and view file contents with smart truncation",
    searchTerms: "view file read open content",
  },
  executeCommand: {
    name: "Run command",
    description: "Execute terminal commands on your system",
    searchTerms: "execute command terminal shell bash run script",
  },
};

export const TOOL_IDS = Object.keys(BUILT_IN_TOOLS) as ToolId[];

export const BUILT_IN_SEARCH_TEXT = TOOL_IDS.map((id) => {
  const t = BUILT_IN_TOOLS[id];
  return `${t.name} ${t.description} ${t.searchTerms}`;
}).join(" ");

export function useEnabledToolCount(): number {
  const [enabledTools] = useAtom(enabledToolsAtom);
  return TOOL_IDS.filter((id) => enabledTools[id]).length;
}
