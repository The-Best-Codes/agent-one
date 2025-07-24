import { useChatMessages, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

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

  if (mode === "inMessage") {
    const isLatestMessage = messages[messages.length - 1]?.id === messageId;
    if (!isLatestMessage) return null;

    if (messageRole !== "assistant") return null;
  }

  const shouldBeVisible = status === "streaming" || status === "submitted";
  if (!shouldBeVisible) return null;

  return (
    <div className={cn("justify-end", mode === "inLayout" ? "p-2" : "")}>
      {status == "streaming" && (
        <span className="animate-caret-blink text-muted-foreground">|</span>
      )}
      {status == "submitted" && (
        <span className="animate-pulse text-muted-foreground">Thinking...</span>
      )}
    </div>
  );
};
