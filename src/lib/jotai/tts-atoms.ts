import { atom } from "jotai";

export type TtsPlaybackState =
  | { status: "idle"; messageId: null }
  | { status: "loading"; messageId: string }
  | { status: "playing"; messageId: string }
  | { status: "error"; messageId: string };

export const ttsPlaybackStateAtom = atom<TtsPlaybackState>({
  status: "idle",
  messageId: null,
});

export const ttsPlaybackControllerAtom = atom<{
  stop: () => void;
} | null>(null);
