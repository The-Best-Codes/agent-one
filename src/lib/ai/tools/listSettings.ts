import { tool } from "ai";
import { z } from "zod";

import { getAiSettings } from "@/lib/settings/registry";
import type { ListSettingsToolConfig } from "@/lib/settings/types";

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
