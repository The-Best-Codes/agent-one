import { tool } from "ai";
import { getDefaultStore } from "jotai";
import { z } from "zod";

import { type SettingAtom, settingAtoms } from "@/lib/jotai/settings-atoms";
import { SETTINGS, type SettingKey } from "@/lib/settings/definitions";

export const createGetSettingTool = () =>
  tool({
    description:
      "Get the current value and metadata (including possible options) of a specific AI-accessible setting key in the desktop application.",
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to retrieve. Must be one of the listed setting keys."),
    }),
    execute: async ({ key }) => {
      const definition = SETTINGS[key as SettingKey];
      if (!definition?.ai) {
        throw new Error(`Setting key "${key}" is not available to AgentOne.`);
      }

      return {
        key,
        ...definition,
        value: getDefaultStore().get(settingAtoms[key as SettingKey] as SettingAtom<unknown>),
      };
    },
  });
