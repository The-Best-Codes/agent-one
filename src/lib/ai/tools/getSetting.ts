import { tool } from "ai";
import { getDefaultStore, type Atom } from "jotai";
import { z } from "zod";

import {
  getSettingDefaultValue,
  getSettingDefinition,
  isAiAccessible,
  type SettingControl,
} from "@/lib/settings/registry";
import type { GetSettingToolConfig } from "@/lib/settings/types";

function describeControl(control: SettingControl) {
  switch (control.type) {
    case "switch":
      return { type: control.type, options: [true, false] };
    case "select":
      return {
        type: control.type,
        options: control.options.map(({ value, label }) => ({ value, label })),
      };
    case "slider":
      return {
        type: control.type,
        min: control.min,
        max: control.max,
        step: control.step,
        unit: control.unit,
      };
    case "number":
      return { type: control.type, min: control.min, max: control.max, unit: control.unit };
    case "text":
      return { type: control.type, maxLength: control.maxLength };
    case "custom":
      return { type: control.type };
  }
}

export const createGetSettingTool = (config: GetSettingToolConfig) =>
  tool({
    description:
      "Get the current value and metadata (including possible options or allowed range) of a specific AI-accessible setting in the desktop application.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to retrieve. Must be one of the listed setting keys."),
    }),
    execute: async (input) => {
      const { key } = input;
      const setting = getSettingDefinition(key);

      if (!setting || !isAiAccessible(setting.definition) || !setting.definition.atom) {
        throw new Error(`Setting key "${key}" is not valid or inspectable.`);
      }

      const { definition, section } = setting;
      const store = getDefaultStore();
      const value = store.get(definition.atom as Atom<unknown>);

      return {
        id: definition.id,
        key: definition.key,
        title: definition.title,
        description: definition.description,
        docs: definition.docs,
        section,
        defaultValue: getSettingDefaultValue(definition),
        value,
        ...describeControl(definition.control),
      };
    },
  });
