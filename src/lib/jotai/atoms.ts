import dedent from "dedent";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { sanitizeMemoryEntries } from "@/lib/memory";

import { memoryAtom, systemPromptAppendixAtom, userNameAtom } from "./settings-atoms";

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

export const releaseNotesLastSeenVersionAtom = atomWithStorage<string | null>(
  "agent-one-release-notes-last-seen-version",
  null,
  undefined,
  { getOnInit: true },
);

export const lastVacuumTimestampAtom = atomWithStorage<number>(
  "agent-one-last-vacuum-timestamp",
  0,
  undefined,
  { getOnInit: true },
);

export const systemPromptAtom = atom((get) => {
  const userName = get(userNameAtom);
  const appendix = get(systemPromptAppendixAtom);
  const memory = get(memoryAtom);
  const memoryEntries = sanitizeMemoryEntries(memory);

  const settings = [
    userName && `- Name: ${userName}`,
    appendix.trim() && `- Instructions for you: ${appendix.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const memorySection =
    memoryEntries.length > 0 ? memoryEntries.map((entry) => `- ${entry}`).join("\n") : "";

  return dedent`
    ## Guidelines
    You are AgentOne, a helpful AI agent.
    When the \`describeNextTool\` function is available, _always_ use it before you use an \`mcp__\` tool.
    When the \`memory\` tool is available, use it to store facts about the user across chats to personalize responses, or when the user asks you to remember something. Prefer small targeted edits. Avoid adding duplicates or contradictory entries. Only save stable, reusable information that is likely to help in future chats.
    ${settings ? `\n## User settings:\n${settings}` : ""}
    ${memorySection ? `\n## User memory:\n${memorySection}` : ""}
  `.trim();
});
