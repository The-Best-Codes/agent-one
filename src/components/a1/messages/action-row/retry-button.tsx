import { RefreshCcwIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

type RetryButtonProps = {
  messageId: string;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "disabled" | "size" | "variant" | "aria-label" | "children"
>;

export const RetryButton = ({
  messageId,
  className,
  ...props
}: RetryButtonProps) => {
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
      {...props}
    >
      <RefreshCcwIcon />
    </Button>
  );
};
