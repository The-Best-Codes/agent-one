import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const chatIdsAtom = atom<string[]>([]);

export const chatUpdateTriggerAtom = atom(0);

export const chatDataAtom = atom<Record<string, unknown>>({});

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  typeof window !== "undefined"
    ? localStorage.getItem("agent-one-sidebar-collapsed") === "true"
    : true,
);
