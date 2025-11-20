import { createGroq } from "@ai-sdk/groq";
import { getDefaultStore } from "jotai";

import { groqApiKeyAtom } from "@/lib/jotai/settings-atoms";

export function getGroq() {
  const store = getDefaultStore();
  const settingKey = store.get(groqApiKeyAtom);
  const apiKey = settingKey || import.meta.env.AGENT_ONE_GROQ_API_KEY;

  return createGroq({
    apiKey,
  });
}

export const groq = getGroq();
