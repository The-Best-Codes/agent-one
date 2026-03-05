import type { UIMessage } from "ai";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";

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
          <span className="text-muted-foreground animate-pulse">
            {isApiKeysLoading
              ? "Loading API keys..."
              : isMcpLoading
                ? "Starting extensions..."
                : "Thinking..."}
          </span>
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
            <span className="text-muted-foreground animate-pulse">
              {isApiKeysLoading
                ? "Loading API keys..."
                : isMcpLoading
                  ? "Starting extensions..."
                  : "Thinking..."}
            </span>
          </div>
        );
      }

      return null;
    }
  }

  return null;
};
