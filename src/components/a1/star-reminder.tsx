import { openUrl } from "@tauri-apps/plugin-opener";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { completedResponseCountAtom, starReminderDismissedAtom } from "@/lib/jotai/atoms";

const TOAST_ID = "star-reminder";
const REPO_URL = "https://github.com/The-Best-Codes/agent-one";
const MIN_COMPLETED_RESPONSES = 3;

export function StarReminder() {
  const { status } = useChatStatus();
  const [completedResponses, setCompletedResponses] = useAtom(completedResponseCountAtom);
  const [dismissed, setDismissed] = useAtom(starReminderDismissedAtom);
  const wasRespondingRef = useRef(false);

  useEffect(() => {
    if (dismissed) return;
    if (status === "streaming" || status === "submitted") {
      wasRespondingRef.current = true;
    } else if (wasRespondingRef.current) {
      wasRespondingRef.current = false;
      if (status === "ready") setCompletedResponses((count) => count + 1);
    }
  }, [status, dismissed, setCompletedResponses]);

  const shouldShow = !dismissed && completedResponses >= MIN_COMPLETED_RESPONSES;

  useEffect(() => {
    if (!shouldShow) return;

    toast("Enjoying AgentOne?", {
      id: TOAST_ID,
      description:
        "We work hard to keep AgentOne open source and free. If it's been useful to you, consider starring the repo on GitHub!",
      action: {
        label: "Star",
        onClick: () => {
          setDismissed(true);
          void openUrl(REPO_URL);
        },
      },
      onDismiss: () => setDismissed(true),
      duration: Infinity,
    });
  }, [shouldShow, setDismissed]);

  return null;
}
