import { useAtomValue } from "jotai";
import {
  AlertCircleIcon,
  CircleDotDashedIcon,
  Loader2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  type ChatStatusIndicator as ChatStatusIndicatorType,
  chatStatusIndicatorsAtom,
} from "@/lib/jotai/atoms";
import { showChatStatusIndicatorAtom } from "@/lib/jotai/settings-atoms";

const DEBOUNCE_MS = 150;

const StatusIcon = ({ status }: { status: ChatStatusIndicatorType }) => {
  if (!status) return null;

  switch (status) {
    case "loading":
      return (
        <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
      );
    case "error":
      return <AlertCircleIcon className="text-destructive size-4 shrink-0" />;
    case "unread":
      return (
        <CircleDotDashedIcon className="text-foreground size-4 shrink-0" />
      );
    default:
      return null;
  }
};

export const ChatStatusIndicator = ({ chatId }: { chatId: string }) => {
  const showStatusIndicator = useAtomValue(showChatStatusIndicatorAtom);
  const chatStatusIndicators = useAtomValue(chatStatusIndicatorsAtom);
  const rawStatus = showStatusIndicator ? chatStatusIndicators[chatId] : null;

  const [displayedStatus, setDisplayedStatus] =
    useState<ChatStatusIndicatorType>(rawStatus ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (rawStatus === "loading" || rawStatus === "error") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDisplayedStatus(rawStatus);
    } else {
      if (displayedStatus === "loading") {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setDisplayedStatus(rawStatus ?? null);
        }, DEBOUNCE_MS);
      } else {
        setDisplayedStatus(rawStatus ?? null);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStatus]);

  return <StatusIcon status={displayedStatus} />;
};
