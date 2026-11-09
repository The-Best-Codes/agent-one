import { atom } from "jotai";

import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getMergedEnabledTools } from "@/lib/settings/tools";
import type { ToolId } from "@/lib/settings/types";

export const TOOL_SETS = {
  memory: ["memory"],
  chatHistory: ["searchChats", "readChat"],
  settings: ["listSettings", "getSetting", "updateSetting"],
  settingsChanges: ["updateSetting"],
  scheduledAgents: [
    "listScheduledAgents",
    "createScheduledAgent",
    "updateScheduledAgent",
    "deleteScheduledAgent",
  ],
  scheduledAgentChanges: ["createScheduledAgent", "updateScheduledAgent", "deleteScheduledAgent"],
  web: ["webSearch", "getUrlContent", "wikipedia"],
  readFiles: ["viewFile"],
  changeFiles: ["editFile", "createFile", "deleteFile"],
  commands: ["executeCommand"],
  subAgents: ["subAgent"],
  feedback: ["sendFeedback"],
  computerUse: ["computerUseObserve", "computerUseAct"],
} satisfies Record<string, ToolId[]>;

export const toolsEnabledAtom = (toolIds: ToolId[]) =>
  atom((get) => {
    const enabled = getMergedEnabledTools(get(settingAtoms.ENABLED_TOOLS));
    return toolIds.every((toolId) => enabled[toolId]);
  });
