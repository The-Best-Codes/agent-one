import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { Loader2Icon } from "lucide-react";

export const ChatMessageLoading = () => {
  const { status } = useChatStatus();

  return (
    <div className="justify-end p-2">
      {status == "streaming" && (
        <Loader2Icon className="w-4 h-4 animate-spin text-gray-500" />
        // TODO: Replace above with typing animation or something like ChatGPT's indicator
      )}
      {status == "submitted" && (
        <span className="animate-pulse text-muted-foreground">Thinking...</span>
      )}
    </div>
  );
};
