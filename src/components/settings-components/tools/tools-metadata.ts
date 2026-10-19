import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";
import type { ToolConfigs, ToolId } from "@/lib/settings/types";

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
  listScheduledAgents: {
    name: "List scheduled agents",
    description: "View scheduled agents and their configuration",
    anchor: "list-scheduled-agents",
  },
  createScheduledAgent: {
    name: "Create scheduled agent",
    description: "Create an agent that runs on a schedule",
    anchor: "create-scheduled-agent",
  },
  updateScheduledAgent: {
    name: "Update scheduled agent",
    description: "Change an existing scheduled agent",
    anchor: "update-scheduled-agent",
  },
  deleteScheduledAgent: {
    name: "Delete scheduled agent",
    description: "Permanently delete a scheduled agent",
    anchor: "delete-scheduled-agent",
  },
  searchChats: {
    name: "Search chats",
    description: "Search and list your past conversations",
    anchor: "search-chats",
  },
  readChat: {
    name: "Read chat",
    description: "Read the messages of a past conversation",
    anchor: "read-chat",
  },
  computerObserve: {
    name: "See apps",
    description: "Look at the apps open on your computer and read what is on screen",
    anchor: "see-apps",
  },
  computerAct: {
    name: "Use apps",
    description: "Click, type, and scroll in the apps open on your computer",
    anchor: "use-apps",
  },
};

export interface ToolGroup {
  title: string;
  description: string;
  toolIds: ToolId[];
  desktopOnly?: boolean;
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
  {
    title: "Scheduled Agents",
    description: "Let AgentOne view and manage scheduled agents.",
    toolIds: [
      "listScheduledAgents",
      "createScheduledAgent",
      "updateScheduledAgent",
      "deleteScheduledAgent",
    ],
  },
  {
    title: "Chat History",
    description: "Let AgentOne look through and read your past conversations.",
    toolIds: ["searchChats", "readChat"],
  },
  {
    title: "Computer Use",
    description:
      "Let AgentOne see and use the other apps on your computer, like a person at the keyboard.",
    toolIds: ["computerObserve", "computerAct"],
    desktopOnly: true,
  },
];

export function getMergedToolConfigs(toolConfigs: ToolConfigs): ToolConfigs {
  return Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS.TOOL_CONFIGS).map(([toolId, defaults]) => [
      toolId,
      { ...defaults, ...toolConfigs[toolId as ToolId] },
    ]),
  ) as ToolConfigs;
}
