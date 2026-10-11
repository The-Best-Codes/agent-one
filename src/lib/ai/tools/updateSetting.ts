import { tool } from "ai";
import { getDefaultStore } from "jotai";
import { z } from "zod";

import { type SettingAtom, settingAtoms } from "@/lib/jotai/settings-atoms";
import { SETTINGS, type SettingKey } from "@/lib/settings/definitions";
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
    execute: async ({ key, value: rawValue, convertToNumber }) => {
      const definition = SETTINGS[key as SettingKey];
      if (definition?.ai !== "write") {
        throw new Error(`Setting key "${key}" can't be updated by AgentOne.`);
      }

      const value = convertToNumber && typeof rawValue === "string" ? Number(rawValue) : rawValue;

      if ("options" in definition && !Object.hasOwn(definition.options, value)) {
        throw new Error(
          `Value ${JSON.stringify(value)} is not a valid option. Valid options are: ${Object.keys(definition.options).join(", ")}`,
        );
      }

      if (typeof value !== typeof definition.default) {
        throw new Error(`Expected a ${typeof definition.default}, but received ${typeof value}`);
      }

      if (
        "min" in definition &&
        (!Number.isInteger(value) || value < definition.min || value > definition.max)
      ) {
        throw new Error(`Expected a whole number between ${definition.min} and ${definition.max}`);
      }

      getDefaultStore().set(settingAtoms[key as SettingKey] as SettingAtom<unknown>, value);

      return { key, value, success: true };
    },
  });
