import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { onboardingCompletedAtom } from "@/lib/jotai/unsynced-local-atoms";

import SuspenseFallback from "./suspense-fallback";

export default function IndexRoute() {
  const navigate = useNavigate();
  const onboardingCompleted = useAtomValue(onboardingCompletedAtom);

  useEffect(() => {
    if (!onboardingCompleted) {
      void navigate("/onboarding", { replace: true });
    } else {
      void navigate("/chat", { replace: true });
    }
  });

  return <SuspenseFallback />;
}
