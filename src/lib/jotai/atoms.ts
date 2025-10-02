import { atom } from "jotai";

export const chatIdsAtom = atom<string[]>([]);

export const chatUpdateTriggerAtom = atom(0);

export const chatDataAtom = atom<Record<string, unknown>>({});
