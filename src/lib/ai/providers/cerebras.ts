import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getDefaultStore } from "jotai";

import { cerebrasApiKeyAtom } from "@/lib/jotai/settings-atoms";

export function getCerebras() {
  const store = getDefaultStore();
  const settingKey = store.get(cerebrasApiKeyAtom);
  const apiKey = settingKey || import.meta.env.AGENT_ONE_CEREBRAS_API_KEY;

  return createOpenAICompatible({
    name: "cerebras",
    apiKey,
    baseURL: "https://api.cerebras.ai/v1",
    headers: {
      "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
    },
  });
}

export const cerebras = getCerebras();
