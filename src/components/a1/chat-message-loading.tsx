import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

export const ChatMessageLoading = () => {
  const { status } = useChatStatus();

  const shouldBeVisible = status === "streaming" || status === "submitted";
  if (!shouldBeVisible) return null;

  return (
    <div className="justify-end p-2">
      {status == "streaming" && (
        <span className="animate-caret-blink text-muted-foreground">|</span>
      )}
      {status == "submitted" && (
        <span className="animate-pulse text-muted-foreground">Thinking...</span>
      )}
    </div>
  );
};
