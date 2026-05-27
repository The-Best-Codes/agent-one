import { atom } from "jotai";
import { atomFamily, atomWithStorage, unwrap } from "jotai/utils";

import type { TtsProviderId } from "@/lib/settings/types";
import { keyringStorage } from "@/lib/storage/keyring-storage";

const TTS_API_KEY_STORAGE_KEYS = {
  openai: "OPENAI_TTS_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
  lmnt: "LMNT_API_KEY",
  hume: "HUME_API_KEY",
} as const satisfies Record<TtsProviderId, string>;

function createTtsApiKeyAtom(providerId: TtsProviderId) {
  return unwrap(
    atomWithStorage<string>(TTS_API_KEY_STORAGE_KEYS[providerId], "", keyringStorage, {
      getOnInit: true,
    }),
    (prev) => prev ?? "",
  );
}

export const ttsApiKeyAtomFamily = atomFamily((providerId: TtsProviderId) =>
  createTtsApiKeyAtom(providerId),
);

export const ttsApiKeysAtom = atom((get) => ({
  openai: get(ttsApiKeyAtomFamily("openai")),
  elevenlabs: get(ttsApiKeyAtomFamily("elevenlabs")),
  lmnt: get(ttsApiKeyAtomFamily("lmnt")),
  hume: get(ttsApiKeyAtomFamily("hume")),
}));
