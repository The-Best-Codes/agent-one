import type { UIMessage } from "ai";

import { Spinner } from "@/components/ui/spinner";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { cn } from "@/lib/utils";

const LoadingIndicator = ({
  isApiKeysLoading,
  isMcpLoading,
  className,
}: {
  isApiKeysLoading: boolean;
  isMcpLoading: boolean;
  className?: string;
}) => {
  const text = isApiKeysLoading
    ? "Loading API keys"
    : isMcpLoading
      ? "Starting extensions"
      : "Thinking";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Spinner className="text-foreground size-4" />
      <span className="text-foreground text-sm font-bold">{text}</span>
    </div>
  );
};

export const ChatMessageLoading = ({
  mode = "inLayout",
  messageId,
  messageRole,
}: {
  mode?: "inLayout" | "inMessage";
  messageId?: string;
  messageRole?: UIMessage["role"];
}) => {
  const { status } = useChatStatus();
  const messages = useChatMessages();
  const { isApiKeysLoading } = useApiKeys();
  const { isMcpLoading } = useTools();

  const lastOverallMessage = messages[messages.length - 1];
  const isLatestMessageOverall = lastOverallMessage?.id === messageId;

  if (mode === "inMessage") {
    if (!isLatestMessageOverall || messageRole !== "assistant") {
      return null;
    }

    if (status === "streaming") {
      return (
        <div className="justify-end">
          <span className="animate-caret-blink text-muted-foreground">|</span>
        </div>
      );
    }

    if (status === "submitted" && lastOverallMessage.role === "assistant") {
      return (
        <div className="justify-end">
          <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />
        </div>
      );
    }

    return null;
  }

  if (mode === "inLayout") {
    if (status === "streaming") {
      return null;
    }

    if (status === "submitted") {
      if (!lastOverallMessage || lastOverallMessage.role === "user") {
        return (
          <div className="justify-end p-2">
            <LoadingIndicator isApiKeysLoading={isApiKeysLoading} isMcpLoading={isMcpLoading} />
          </div>
        );
      }

      return null;
    }
  }

  return null;
};
