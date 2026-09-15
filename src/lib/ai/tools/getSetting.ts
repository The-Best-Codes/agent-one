import { tool } from "ai";
import { getDefaultStore, type Atom } from "jotai";
import { z } from "zod";

import { getSettingDefinition } from "@/lib/settings/registry";
import type { GetSettingToolConfig } from "@/lib/settings/types";

export const createGetSettingTool = (config: GetSettingToolConfig) =>
  tool({
    description:
      "Get the current value and metadata (including possible options) of a specific AI-accessible setting key in the desktop application.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to retrieve. Must be one of the listed setting keys."),
    }),
    execute: async (input) => {
      const { key } = input;
      const definition = getSettingDefinition(key);
      if (!definition?.aiAccessible || !definition.atom) {
        throw new Error(`Setting key "${key}" is not valid or inspectable.`);
      }
      const store = getDefaultStore();
      const value = store.get(definition.atom as Atom<unknown>);

      return {
        id: definition.id,
        key: definition.key,
        title: definition.title,
        description: definition.description,
        docs: definition.docs,
        type: definition.controls.type,
        options:
          definition.controls.type === "select"
            ? definition.controls.options
            : definition.controls.type === "switch"
              ? [true, false]
              : null,
        defaultValue: definition.defaultValue,
        value,
      };
    },
  });
