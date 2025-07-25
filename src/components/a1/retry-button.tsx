import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";
import { RefreshCcwIcon } from "lucide-react";

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
      regenerate({ messageId }); // TODO: Confirm dialog before doing this, as it discards all messages after the one being regenerated.
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isDisabled}
      className={className}
      size="icon"
      variant="ghost"
      title="Regenerate response"
    >
      <RefreshCcwIcon />
    </Button>
  );
};
