import { tool } from "ai";
import { z } from "zod";

import { getAiSettings } from "@/lib/settings/registry";
import type { ListSettingsToolConfig } from "@/lib/settings/types";

export const createListSettingsTool = (config: ListSettingsToolConfig) =>
  tool({
    description:
      "List all AI-accessible settings in the desktop application. Each entry includes the key to use with getSetting and updateSetting, plus the settings section it appears in.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => {
      return {
        settings: getAiSettings().map(({ definition, section }) => ({
          id: definition.id,
          key: definition.key,
          title: definition.title,
          description: definition.description,
          section,
          type: definition.control.type,
        })),
      };
    },
  });
