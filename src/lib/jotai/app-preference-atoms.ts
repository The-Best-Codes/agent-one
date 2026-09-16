import { atomWithStorage } from "jotai/utils";

/**
 * Device-level preferences that are not part of `DEFAULT_SETTINGS`.
 * They live in their own module so the settings registry can reference them
 * without pulling in `atoms.ts` (which is part of a sync-manager import cycle).
 */
export const syncEnabledAtom = atomWithStorage("agent-one-sync-enabled", true, undefined, {
  getOnInit: true,
});

export const hideAgentOneModelsAtom = atomWithStorage(
  "agent-one-hide-agentone-models",
  false,
  undefined,
  { getOnInit: true },
);
