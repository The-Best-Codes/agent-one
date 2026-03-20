import dedent from "dedent";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { systemPromptAppendixAtom, userNameAtom } from "./settings-atoms";

export type ChatStatusIndicator = "loading" | "error" | "unread" | null;

export const chatStatusIndicatorsAtom = atom<Record<string, ChatStatusIndicator>>({});

export const chatIdsAtom = atom<string[]>([]);

export const chatUpdateTriggerAtom = atom(0);

export const onboardingCompletedAtom = atomWithStorage(
  "agent-one-onboarding-completed",
  false,
  undefined,
  { getOnInit: true },
);

export const syncEnabledAtom = atomWithStorage("agent-one-sync-enabled", false, undefined, {
  getOnInit: true,
});

export const hideAgentOneModelsAtom = atomWithStorage(
  "agent-one-hide-agentone-models",
  false,
  undefined,
  { getOnInit: true },
);

export const updateRemindAfterAtom = atomWithStorage<number | null>(
  "agent-one-update-remind-after",
  null,
  undefined,
  { getOnInit: true },
);

export const systemPromptAtom = atom((get) => {
  const userName = get(userNameAtom);
  const appendix = get(systemPromptAppendixAtom);

  const settings = [
    userName && `- Name: ${userName}`,
    appendix.trim() && `- Instructions for you: ${appendix.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  return dedent`
    You are AgentOne, a helpful AI agent.
    ${settings ? `\nUser settings:\n${settings}` : ""}
  `.trim();
});
