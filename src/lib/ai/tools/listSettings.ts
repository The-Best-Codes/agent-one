import { tool } from "ai";
import { z } from "zod";

import { getInspectableKeys } from "@/lib/settings/metadata";
import type { ListSettingsToolConfig } from "@/lib/settings/types";

export const createListSettingsTool = (config: ListSettingsToolConfig) =>
  tool({
    description: "List all inspectable settings keys.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({}),
    execute: async () => {
      return {
        keys: getInspectableKeys(),
      };
    },
  });
