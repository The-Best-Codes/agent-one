import { tool } from "ai";
import { getDefaultStore, type WritableAtom } from "jotai";
import { z } from "zod";

import { getSettingAtom, isInspectableKey, validateSettingValue } from "@/lib/settings/metadata";
import type { UpdateSettingToolConfig } from "@/lib/settings/types";

export const createUpdateSettingTool = (config: UpdateSettingToolConfig) =>
  tool({
    description: "Update a specific setting key's value.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to update. Must be one of the listed setting keys."),
      value: z
        .any()
        .describe(
          "The new value to write. Must be one of the possible options for enum or boolean settings.",
        ),
    }),
    execute: async (input) => {
      const { key, value } = input;
      if (!isInspectableKey(key)) {
        throw new Error(`Setting key "${key}" is not valid or inspectable.`);
      }

      const validation = validateSettingValue(key, value);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const store = getDefaultStore();
      const atom = getSettingAtom(key) as WritableAtom<unknown, [unknown], void>;
      store.set(atom, value);

      return {
        key,
        value,
        success: true,
      };
    },
  });
