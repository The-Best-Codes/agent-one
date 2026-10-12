// Stored per device (not synced with the account) because OpenShell availability depends on the device.

import { atomWithStorage } from "jotai/utils";

export const sandboxEnabledAtom = atomWithStorage<boolean>(
  "agent-one-sandbox-enabled",
  false,
  undefined,
  { getOnInit: true },
);
