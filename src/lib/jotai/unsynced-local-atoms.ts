import { atomWithStorage, createJSONStorage } from "jotai/utils";

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  false,
  undefined,
  { getOnInit: true },
);

export const debugModeEnabledAtom = atomWithStorage<boolean>(
  "agent-one-debug-mode",
  false,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);

export const skipPlanChecksAtom = atomWithStorage<boolean>(
  "agent-one-skip-plan-checks",
  false,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);

export const globalAgentsFilesAtom = atomWithStorage<string[]>(
  "agent-one-agents-files",
  ["~/AGENTS.md"],
  undefined,
  { getOnInit: true },
);

export const globalSkillsFoldersAtom = atomWithStorage<string[]>(
  "agent-one-skills-folders",
  ["~/.agents/skills", "~/.claude/skills"],
  undefined,
  { getOnInit: true },
);

export const collapsedProjectIdsAtom = atomWithStorage<string[]>(
  "agent-one-collapsed-project-ids",
  [],
  undefined,
  { getOnInit: true },
);

export const onboardingCompletedAtom = atomWithStorage(
  "agent-one-onboarding-completed",
  false,
  undefined,
  { getOnInit: true },
);

export const onboardingReminderDismissedAtom = atomWithStorage(
  "agent-one-onboarding-reminder-dismissed",
  false,
  undefined,
  { getOnInit: true },
);

export const starReminderDismissedAtom = atomWithStorage(
  "agent-one-star-reminder-dismissed",
  false,
  undefined,
  { getOnInit: true },
);

export const completedResponseCountAtom = atomWithStorage(
  "agent-one-completed-response-count",
  0,
  undefined,
  { getOnInit: true },
);

export const hideAgentOneModelsAtom = atomWithStorage(
  "agent-one-hide-agentone-models",
  false,
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

export const lastModelDirectorySyncTimestampAtom = atomWithStorage<number>(
  "agent-one-last-model-directory-sync-timestamp",
  0,
  undefined,
  { getOnInit: true },
);

export const dismissedOAuthPromptsAtom = atomWithStorage<string[]>(
  "agent-one-dismissed-oauth-prompts",
  [],
  undefined,
  { getOnInit: true },
);

export const providerSetupDismissedAtom = atomWithStorage<Record<string, boolean>>(
  "agent-one-setting-PROVIDER_SETUP_DISMISSED",
  {},
  undefined,
  { getOnInit: true },
);
