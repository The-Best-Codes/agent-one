import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

export const RetryButton = ({
  messageId,
  className,
}: {
  messageId: string;
  className?: string;
}) => {
  const { regenerate } = useChatFunctions();
  const { status } = useChatStatus();

  const isDisabled = status === "streaming" || status === "submitted";

  const handleRetry = () => {
    if (!isDisabled) {
      regenerate({ messageId });
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isDisabled}
      className={className}
      size="icon"
      variant="secondary"
      aria-label="Regenerate response"
    >
      <RefreshCcwIcon />
    </Button>
  );
};
