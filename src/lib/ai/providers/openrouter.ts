import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getDefaultStore } from "jotai";

import { openrouterApiKeyAtom } from "@/lib/jotai/settings-atoms";

export function getOpenRouter() {
  const store = getDefaultStore();
  const settingKey = store.get(openrouterApiKeyAtom);
  const apiKey = settingKey || import.meta.env.AGENT_ONE_OPENROUTER_API_KEY;

  return createOpenRouter({
    apiKey,
  });
}

export const openRouter = getOpenRouter();
