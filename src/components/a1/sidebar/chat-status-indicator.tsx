import { useAtomValue } from "jotai";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

import { chatStatusesAtom } from "@/lib/jotai/atoms";
import { showChatStatusIndicatorAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

interface ChatStatusIndicatorProps {
  chatId: string;
}

export const ChatStatusIndicator = ({ chatId }: ChatStatusIndicatorProps) => {
  const showIndicator = useAtomValue(showChatStatusIndicatorAtom);
  const chatStatuses = useAtomValue(chatStatusesAtom);

  if (!showIndicator) {
    return null;
  }

  const statusInfo = chatStatuses.get(chatId);

  if (!statusInfo) {
    return null;
  }

  const { status, error } = statusInfo;

  if (error) {
    return (
      <AlertCircleIcon
        className={cn("text-destructive size-3.5 shrink-0")}
        aria-label="Error"
      />
    );
  }

  if (status === "streaming" || status === "submitted") {
    return (
      <LoaderCircleIcon
        className={cn("text-primary size-3.5 shrink-0 animate-spin")}
        aria-label="Loading"
      />
    );
  }

  return null;
};
