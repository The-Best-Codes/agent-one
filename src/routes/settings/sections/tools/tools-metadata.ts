import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

export interface ToolInfo {
  name: string;
  description: string;
  anchor: string;
}

export const TOOL_INFO: Record<ToolId, ToolInfo> = {
  dateTime: {
    name: "Current date and time",
    description: "Check the current date and time",
    anchor: "date-time",
  },
  waitNumberMilliseconds: {
    name: "Pause",
    description: "Wait for a short amount of time",
    anchor: "pause",
  },
  getUrlContent: {
    name: "Browse",
    description: "Read content from web pages",
    anchor: "browse",
  },
  webSearch: {
    name: "Search the web",
    description: "Find information online",
    anchor: "search-the-web",
  },
  wikipedia: {
    name: "Wikipedia",
    description: "Search Wikipedia and read article summaries, content, links, and categories",
    anchor: "wikipedia",
  },
  memory: {
    name: "Memory",
    description: "Maintain concise long-term user memory",
    anchor: "memory",
  },
  editFile: {
    name: "Edit file",
    description: "Edit files by replacing text content",
    anchor: "edit-file",
  },
  createFile: {
    name: "Create file",
    description: "Create new files with content",
    anchor: "create-file",
  },
  deleteFile: {
    name: "Delete file",
    description: "Delete files from the filesystem",
    anchor: "delete-file",
  },
  viewFile: {
    name: "View file",
    description: "Read and view file contents with smart truncation",
    anchor: "view-file",
  },
  executeCommand: {
    name: "Run command",
    description: "Execute terminal commands on your system",
    anchor: "run-command",
  },
  subAgent: {
    name: "Spawn subagent",
    description:
      "Delegate focused work to a streamed subagent. Subagents inherit your current model and enabled tools, but cannot spawn other subagents.",
    anchor: "spawn-subagent",
  },
  listSettings: {
    name: "List settings",
    description: "List all available configuration setting keys",
    anchor: "list-settings",
  },
  getSetting: {
    name: "Get setting",
    description: "Get the current value and possible options of a specific setting",
    anchor: "get-setting",
  },
  updateSetting: {
    name: "Update setting",
    description: "Update a setting key's value",
    anchor: "update-setting",
  },
};

export interface ToolGroup {
  title: string;
  description: string;
  toolIds: ToolId[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    title: "Web",
    description: "Let AgentOne look things up online and read the pages it finds.",
    toolIds: ["webSearch", "getUrlContent", "wikipedia"],
  },
  {
    title: "Files",
    description: "Read and change files on your computer.",
    toolIds: ["viewFile", "editFile", "createFile", "deleteFile"],
  },
  {
    title: "Utilities",
    description: "Everyday helpers like the clock, timers, and long-term memory.",
    toolIds: ["dateTime", "waitNumberMilliseconds", "memory"],
  },
  {
    title: "System",
    description: "Reach outside AgentOne by running commands or delegating to a subagent.",
    toolIds: ["executeCommand", "subAgent"],
  },
  {
    title: "AgentOne Settings",
    description: "Let AgentOne inspect and update your AgentOne settings.",
    toolIds: ["listSettings", "getSetting", "updateSetting"],
  },
];

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
