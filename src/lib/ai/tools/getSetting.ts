import { tool } from "ai";
import { getDefaultStore, type Atom } from "jotai";
import { z } from "zod";

import { getInspectableKeys, getSettingAtom, getSettingMetadata } from "@/lib/settings/metadata";
import type { GetSettingToolConfig } from "@/lib/settings/types";

export const createGetSettingTool = (config: GetSettingToolConfig) =>
  tool({
    description:
      "Get the current value and metadata (including possible options) of a specific setting key.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      key: z
        .string()
        .describe("The setting key to retrieve. Must be one of the listed setting keys."),
    }),
    execute: async (input) => {
      const { key } = input;
      if (!getInspectableKeys().includes(key)) {
        throw new Error(`Setting key "${key}" is not valid or inspectable.`);
      }

      const metadata = getSettingMetadata(key);
      const store = getDefaultStore();
      const atom = getSettingAtom(key);
      const value = store.get(atom as Atom<unknown>);

      return {
        ...metadata,
        value,
      };
    },
  });
