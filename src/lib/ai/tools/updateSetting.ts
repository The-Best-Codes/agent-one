import { tool } from "ai";
import { getDefaultStore, type WritableAtom } from "jotai";
import { z } from "zod";

import { getSettingAtom, isInspectableKey, validateSettingValue } from "@/lib/settings/metadata";
import type { UpdateSettingToolConfig } from "@/lib/settings/types";

export const createUpdateSettingTool = (config: UpdateSettingToolConfig) =>
  tool({
    description: "Update a specific AI-accessible setting key's value.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to update. Must be one of the listed setting keys."),
      value: z
        .any()
        .describe(
          "The new value to write. Must match the setting's expected type or one of its possible options.",
        ),
      convertToNumber: z
        .boolean()
        .optional()
        .describe(
          "Set to true to convert a numeric string value to a number before writing it (for example, value='5' becomes 5). Use this for numeric settings.",
        ),
    }),
    execute: async (input) => {
      const { key, value, convertToNumber } = input;
      if (!isInspectableKey(key)) {
        throw new Error(`Setting key "${key}" is not valid or inspectable.`);
      }

      const normalizedValue = convertToNumber && typeof value === "string" ? Number(value) : value;
      const validation = validateSettingValue(key, normalizedValue);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const store = getDefaultStore();
      const atom = getSettingAtom(key) as WritableAtom<unknown, [unknown], void>;
      store.set(atom, normalizedValue);

      return {
        key,
        value: normalizedValue,
        success: true,
      };
    },
  });
