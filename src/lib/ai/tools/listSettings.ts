import { tool } from "ai";
import { z } from "zod";

import { SETTING_KEYS, SETTINGS } from "@/lib/settings/definitions";
import type { ListSettingsToolConfig } from "@/lib/settings/types";

export const createListSettingsTool = (config: ListSettingsToolConfig) =>
  tool({
    description:
      "List the AI-accessible settings in the desktop application, with whether each can be read or also updated.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => ({
      keys: SETTING_KEYS.filter((key) => SETTINGS[key].ai).map((key) => ({
        key,
        label: SETTINGS[key].label,
        access: SETTINGS[key].ai,
      })),
    }),
  });
