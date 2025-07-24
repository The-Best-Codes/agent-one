import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import type { UIMessage } from "ai";

// TODO: Reduce rerendering (mostly cause of useChatMessages)

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
  const { messages } = useChatMessages();

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
          <span className="animate-pulse text-muted-foreground">
            Thinking...
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
            <span className="animate-pulse text-muted-foreground">
              Thinking...
            </span>
          </div>
        );
      }

      return null;
    }
  }

  return null;
};
