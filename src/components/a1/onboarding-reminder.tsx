import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { onboardingCompletedAtom, onboardingReminderDismissedAtom } from "@/lib/jotai/atoms";

const TOAST_ID = "onboarding-reminder";

export function OnboardingReminder() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onboardingCompleted = useAtomValue(onboardingCompletedAtom);
  const reminderDismissed = useAtomValue(onboardingReminderDismissedAtom);
  const setReminderDismissed = useSetAtom(onboardingReminderDismissedAtom);

  const shouldShow =
    !onboardingCompleted && !reminderDismissed && pathname !== "/" && pathname !== "/onboarding";

  useEffect(() => {
    if (!shouldShow) {
      toast.dismiss(TOAST_ID);
      return;
    }

    toast("You haven't finished setting up AgentOne", {
      id: TOAST_ID,
      action: {
        label: "Take onboarding",
        onClick: () => void navigate("/onboarding"),
      },
      cancel: {
        label: "Never",
        onClick: () => setReminderDismissed(true),
      },
      cancelButtonStyle: {
        color: "white",
        backgroundColor: "var(--color-destructive)",
      },
      duration: Infinity,
    });
  }, [shouldShow, navigate, setReminderDismissed]);

  return null;
}
