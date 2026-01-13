import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatMessages,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

export const MainInputIncompleteSection = ({
  onRetry,
}: {
  onRetry?: () => void;
}) => {
  const { error, status } = useChatStatus();
  const { regenerate } = useChatFunctions();
  const messages = useChatMessages();

  if (error || status === "streaming" || status === "submitted") {
    return null;
  }

  if (messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return null;
  }

  return (
    <div className="bg-muted/50 border-muted-foreground/20 text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <h3 className="text-lg font-bold">Incomplete Chat</h3>
        <span className="text-base">
          The last message didn't receive a response.
        </span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button
          onClick={() => {
            regenerate();
            onRetry?.();
          }}
          variant="default"
        >
          <RefreshCcwIcon />
          Retry
        </Button>
      </div>
    </div>
  );
};
