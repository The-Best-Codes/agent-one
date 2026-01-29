import { atomWithStorage, loadable, unwrap } from "jotai/utils";

import { DEFAULT_SETTINGS } from "@/lib/settings/types";
import { keyringStorage } from "@/lib/storage/keyring-storage";

const createApiKeyAtoms = <T>(
  key: keyof typeof DEFAULT_SETTINGS,
  defaultValue: T,
) => {
  const baseAtom = atomWithStorage<T>(key, defaultValue, keyringStorage, {
    getOnInit: true,
  });

  const unwrappedAtom = unwrap(
    baseAtom,
    (prev) => (prev as T | undefined) ?? defaultValue,
  );

  const loadableAtom = loadable(baseAtom);

  return { unwrappedAtom, loadableAtom };
};

const googleAtoms = createApiKeyAtoms(
  "GOOGLE_GENERATIVE_AI_API_KEY",
  DEFAULT_SETTINGS.GOOGLE_GENERATIVE_AI_API_KEY,
);
export const googleGenerativeAiApiKeyAtom = googleAtoms.unwrappedAtom;
export const googleGenerativeAiApiKeyLoadableAtom = googleAtoms.loadableAtom;

const groqAtoms = createApiKeyAtoms(
  "GROQ_API_KEY",
  DEFAULT_SETTINGS.GROQ_API_KEY,
);
export const groqApiKeyAtom = groqAtoms.unwrappedAtom;
export const groqApiKeyLoadableAtom = groqAtoms.loadableAtom;

const openrouterAtoms = createApiKeyAtoms(
  "OPENROUTER_API_KEY",
  DEFAULT_SETTINGS.OPENROUTER_API_KEY,
);
export const openrouterApiKeyAtom = openrouterAtoms.unwrappedAtom;
export const openrouterApiKeyLoadableAtom = openrouterAtoms.loadableAtom;

const cerebrasAtoms = createApiKeyAtoms(
  "CEREBRAS_API_KEY",
  DEFAULT_SETTINGS.CEREBRAS_API_KEY,
);
export const cerebrasApiKeyAtom = cerebrasAtoms.unwrappedAtom;
export const cerebrasApiKeyLoadableAtom = cerebrasAtoms.loadableAtom;
