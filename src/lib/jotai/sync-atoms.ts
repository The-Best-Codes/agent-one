import { atomWithStorage } from "jotai/utils";

export const syncEnabledAtom = atomWithStorage("agent-one-sync-enabled", true, undefined, {
  getOnInit: true,
});
