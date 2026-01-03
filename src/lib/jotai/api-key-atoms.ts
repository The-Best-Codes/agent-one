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

// Create loadable atoms for loading state detection
const createLoadableApiKeyAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  return atomWithStorage<T>(key, defaultValue, keyringStorage, {
    getOnInit: true,
  });
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

// Loadable atoms for loading detection
export const googleGenerativeAiApiKeyLoadableAtom = createLoadableApiKeyAtom(
  "GOOGLE_GENERATIVE_AI_API_KEY",
  DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
);

export const groqApiKeyLoadableAtom = createLoadableApiKeyAtom(
  "GROQ_API_KEY",
  DEFAULT_SETTINGS.GROQ_API_KEY,
);

export const openrouterApiKeyLoadableAtom = createLoadableApiKeyAtom(
  "OPENROUTER_API_KEY",
  DEFAULT_SETTINGS.OPENROUTER_API_KEY,
);

export const cerebrasApiKeyLoadableAtom = createLoadableApiKeyAtom(
  "CEREBRAS_API_KEY",
  DEFAULT_SETTINGS.CEREBRAS_API_KEY,
);
