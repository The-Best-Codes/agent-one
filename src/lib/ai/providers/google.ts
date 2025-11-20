import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getDefaultStore } from "jotai";

import { googleGenerativeAiApiKeyAtom } from "@/lib/jotai/settings-atoms";

export function getGoogle() {
  const store = getDefaultStore();
  const settingKey = store.get(googleGenerativeAiApiKeyAtom);
  const apiKey =
    settingKey || import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY;

  return createGoogleGenerativeAI({
    apiKey,
  });
}

export const google = getGoogle();
