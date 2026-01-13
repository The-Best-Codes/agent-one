import dedent from "dedent";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { systemPromptAppendixAtom, userNameAtom } from "./settings-atoms";

export const chatIdsAtom = atomWithStorage(
  "chat-ids",
  [] as string[],
  undefined,
  {
    getOnInit: true,
  },
);

export const chatUpdateTriggerAtom = atom(0);

export interface ChatStatusInfo {
  status: "ready" | "streaming" | "submitted" | "";
  error?: Error;
}

export const chatStatusesAtom = atom<Map<string, ChatStatusInfo>>(new Map());

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  false,
  undefined,
  { getOnInit: true },
);

export const activeSettingsSectionAtom = atomWithStorage(
  "agent-one-active-settings-section",
  "account",
  undefined,
  { getOnInit: true },
);

export const onboardingCompletedAtom = atomWithStorage(
  "agent-one-onboarding-completed",
  false,
  undefined,
  { getOnInit: true },
);

export const systemPromptAtom = atom((get) => {
  const userName = get(userNameAtom);
  const appendix = get(systemPromptAppendixAtom);

  const basePrompt = dedent`You are AgentOne. You are a helpful assistant.${
    userName ? ` The user prefers to be called "${userName}".` : ""
  }`;

  if (appendix.trim()) {
    return `${basePrompt}\n\nAdditional instructions from the user:\n${appendix}`;
  }

  return basePrompt;
});
