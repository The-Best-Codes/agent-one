import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { onboardingCompletedAtom } from "@/lib/jotai/atoms";

import SuspenseFallback from "./suspense-fallback";

export default function IndexRoute() {
  const navigate = useNavigate();
  const onboardingCompleted = useAtomValue(onboardingCompletedAtom);

  useEffect(() => {
    if (!onboardingCompleted) {
      navigate("/onboarding");
    } else {
      navigate("/chat");
    }
  });

  return <SuspenseFallback />;
}
