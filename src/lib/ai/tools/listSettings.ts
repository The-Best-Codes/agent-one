import { tool } from "ai";
import { z } from "zod";

import type { ListSettingsToolConfig } from "@/lib/settings/types";
import { getAiSettings } from "@/routes/settings/settings-registry";

export const createListSettingsTool = (config: ListSettingsToolConfig) =>
  tool({
    description: "List all AI-accessible settings in the desktop application.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => {
      return {
        settings: getAiSettings().map(({ id, key, title, description, section, controls }) => ({
          id,
          key,
          title,
          description,
          section,
          type: controls.type,
        })),
      };
    },
  });
