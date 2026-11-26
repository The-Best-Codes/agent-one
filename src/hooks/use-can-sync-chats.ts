import { useAtomValue } from "jotai";

import { getActivePaidSubscription } from "@/contexts/use-web-auth/web-auth-contexts";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { skipPlanChecksAtom } from "@/lib/jotai/unsynced-local-atoms";

export function useCanSyncChats(): boolean {
  const { customerState } = useWebAuth();
  const skipPlanChecks = useAtomValue(skipPlanChecksAtom);
  return skipPlanChecks || Boolean(customerState && getActivePaidSubscription(customerState));
}
