import { atomWithStorage, loadable, unwrap } from "jotai/utils";

import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { keyringStorage } from "@/lib/storage/keyring-storage";

// Unwrapped atoms, so they don't suspend or hang the UI
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

export const opencodeApiKeyAtom = createApiKeyAtom(
  "OPENCODE_API_KEY",
  DEFAULT_SETTINGS.OPENCODE_API_KEY,
);

// Loadable atoms, for API key context to see. loading state
const createLoadableApiKeyAtom = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  return atomWithStorage<T>(key, defaultValue, keyringStorage, {
    getOnInit: true,
  });
};

export const googleGenerativeAiApiKeyLoadableAtom = loadable(
  createLoadableApiKeyAtom(
    "GOOGLE_GENERATIVE_AI_API_KEY",
    DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
  ),
);

export const groqApiKeyLoadableAtom = loadable(
  createLoadableApiKeyAtom("GROQ_API_KEY", DEFAULT_SETTINGS.GROQ_API_KEY),
);

export const openrouterApiKeyLoadableAtom = loadable(
  createLoadableApiKeyAtom(
    "OPENROUTER_API_KEY",
    DEFAULT_SETTINGS.OPENROUTER_API_KEY,
  ),
);

export const cerebrasApiKeyLoadableAtom = loadable(
  createLoadableApiKeyAtom(
    "CEREBRAS_API_KEY",
    DEFAULT_SETTINGS.CEREBRAS_API_KEY,
  ),
);

export const opencodeApiKeyLoadableAtom = loadable(
  createLoadableApiKeyAtom(
    "OPENCODE_API_KEY",
    DEFAULT_SETTINGS.OPENCODE_API_KEY,
  ),
);
