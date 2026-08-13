import { tool } from "ai";
import { z } from "zod";

import { getInspectableKeys } from "@/lib/settings/metadata";
import type { ListSettingsToolConfig } from "@/lib/settings/types";

export const createListSettingsTool = (config: ListSettingsToolConfig) =>
  tool({
    description: "List the keys of all AI-accessible settings in the desktop application.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => {
      return {
        keys: getInspectableKeys(),
      };
    },
  });
