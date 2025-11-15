import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  lsBooleanOrUndefined,
  lsStringOrUndefined,
} from "./load-from-localstorage";

export const chatIdsAtom = atom<string[]>([]);

export const chatUpdateTriggerAtom = atom(0);

export const chatDataAtom = atom<Record<string, unknown>>({});

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  lsBooleanOrUndefined("agent-one-sidebar-collapsed") ?? false,
);

export const activeSettingsSectionAtom = atomWithStorage(
  "agent-one-active-settings-section",
  lsStringOrUndefined("agent-one-active-settings-section") ?? "appearance",
);
