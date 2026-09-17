import {
  IconBrandWikipedia,
  IconBrain,
  IconCalendar,
  IconClock,
  IconEye,
  IconFilePlus,
  IconHierarchy3,
  IconList,
  IconPencil,
  IconSearch,
  IconSettings,
  IconSettingsCheck,
  IconTerminal2,
  IconTrash,
  IconWorld,
  type Icon,
} from "@tabler/icons-react";

import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

export interface BuiltInToolInfo {
  name: string;
  description: string;
  icon: Icon;
  searchTerms: string;
}

export const BUILT_IN_TOOLS: Record<ToolId, BuiltInToolInfo> = {
  dateTime: {
    name: "Current date and time",
    description: "Check the current date and time",
    icon: IconCalendar,
    searchTerms: "date time clock timezone",
  },
  waitNumberMilliseconds: {
    name: "Pause",
    description: "Wait for a short amount of time",
    icon: IconClock,
    searchTerms: "wait delay pause timer milliseconds",
  },
  getUrlContent: {
    name: "Browse",
    description: "Read content from web pages",
    icon: IconWorld,
    searchTerms: "url website fetch read page",
  },
  webSearch: {
    name: "Search the web",
    description: "Find information online",
    icon: IconSearch,
    searchTerms: "search web internet results",
  },
  wikipedia: {
    name: "Wikipedia",
    description: "Search Wikipedia and read article summaries, content, links, and categories",
    icon: IconBrandWikipedia,
    searchTerms: "wikipedia encyclopedia knowledge article reference",
  },
  memory: {
    name: "Memory",
    description: "Maintain concise long-term user memory",
    icon: IconBrain,
    searchTerms: "memory remember preferences profile facts notes",
  },
  editFile: {
    name: "Edit file",
    description: "Edit files by replacing text content",
    icon: IconPencil,
    searchTerms: "edit file modify change replace text",
  },
  createFile: {
    name: "Create file",
    description: "Create new files with content",
    icon: IconFilePlus,
    searchTerms: "create file new write",
  },
  deleteFile: {
    name: "Delete file",
    description: "Delete files from the filesystem",
    icon: IconTrash,
    searchTerms: "delete file remove",
  },
  viewFile: {
    name: "View file",
    description: "Read and view file contents with smart truncation",
    icon: IconEye,
    searchTerms: "view file read open content",
  },
  executeCommand: {
    name: "Run command",
    description: "Execute terminal commands on your system",
    icon: IconTerminal2,
    searchTerms: "execute command terminal shell bash run script",
  },
  subAgent: {
    name: "Spawn subagent",
    description: "Delegate focused work to a streamed subagent",
    icon: IconHierarchy3,
    searchTerms: "subagent delegate nested agent parallel work",
  },
  listSettings: {
    name: "List settings",
    description: "List all available configuration setting keys",
    icon: IconList,
    searchTerms: "settings list keys config configuration options",
  },
  getSetting: {
    name: "Get setting",
    description: "Get the current value and possible options of a specific setting",
    icon: IconSettings,
    searchTerms: "settings get value options inspect configuration",
  },
  updateSetting: {
    name: "Update setting",
    description: "Update a setting key's value",
    icon: IconSettingsCheck,
    searchTerms: "settings update change set write value configuration",
  },
};

export const TOOL_IDS = Object.keys(BUILT_IN_TOOLS) as ToolId[];

export function getMergedToolConfigs(toolConfigs: ToolConfigs): ToolConfigs {
  return {
    dateTime: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.dateTime, ...toolConfigs.dateTime },
    waitNumberMilliseconds: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.waitNumberMilliseconds,
      ...toolConfigs.waitNumberMilliseconds,
    },
    getUrlContent: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.getUrlContent,
      ...toolConfigs.getUrlContent,
    },
    webSearch: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.webSearch, ...toolConfigs.webSearch },
    wikipedia: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.wikipedia, ...toolConfigs.wikipedia },
    memory: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.memory, ...toolConfigs.memory },
    editFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.editFile, ...toolConfigs.editFile },
    createFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.createFile, ...toolConfigs.createFile },
    deleteFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.deleteFile, ...toolConfigs.deleteFile },
    viewFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.viewFile, ...toolConfigs.viewFile },
    executeCommand: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.executeCommand,
      ...toolConfigs.executeCommand,
    },
    subAgent: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.subAgent, ...toolConfigs.subAgent },
    listSettings: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.listSettings,
      ...toolConfigs.listSettings,
    },
    getSetting: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.getSetting,
      ...toolConfigs.getSetting,
    },
    updateSetting: {
      ...DEFAULT_SETTINGS.TOOL_CONFIGS.updateSetting,
      ...toolConfigs.updateSetting,
    },
  };
}
