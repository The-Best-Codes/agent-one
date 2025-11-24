import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  lsBooleanOrUndefined,
  lsJSONOrUndefined,
  lsStringOrUndefined,
} from "./load-from-localstorage";

export const chatIdsAtom = atomWithStorage(
  "chat-ids",
  lsJSONOrUndefined<string[]>("chat-ids") ?? [],
);

export const chatUpdateTriggerAtom = atom(0);

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  lsBooleanOrUndefined("agent-one-sidebar-collapsed") ?? false,
);

export const activeSettingsSectionAtom = atomWithStorage(
  "agent-one-active-settings-section",
  lsStringOrUndefined("agent-one-active-settings-section") ?? "account",
);

export const onboardingCompletedAtom = atomWithStorage(
  "agent-one-onboarding-completed",
  lsBooleanOrUndefined("agent-one-onboarding-completed") ?? false,
);
