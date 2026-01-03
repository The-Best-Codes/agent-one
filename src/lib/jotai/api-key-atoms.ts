import { atomWithStorage, unwrap } from "jotai/utils";

import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { keyringStorage } from "@/lib/storage/keyring-storage";

const createApiKeyAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  return unwrap(
    atomWithStorage<T>(key, defaultValue, keyringStorage, {
      getOnInit: true,
    }),
    (prev) => (prev as T | undefined) ?? defaultValue,
  );
};

export const googleGenerativeAiApiKeyAtom = createApiKeyAtom(
  "GOOGLE_GENERATIVE_AI_API_KEY",
  DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
);

export const groqApiKeyAtom = createApiKeyAtom(
  "GROQ_API_KEY",
  DEFAULT_SETTINGS.GROQ_API_KEY,
);

export const openrouterApiKeyAtom = createApiKeyAtom(
  "OPENROUTER_API_KEY",
  DEFAULT_SETTINGS.OPENROUTER_API_KEY,
);

export const cerebrasApiKeyAtom = createApiKeyAtom(
  "CEREBRAS_API_KEY",
  DEFAULT_SETTINGS.CEREBRAS_API_KEY,
);
