import { IconRefresh } from "@tabler/icons-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useChatFunctions, useChatStatus } from "@/contexts/use-chat/chat-hooks";

type RetryButtonProps = {
  messageId: string;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "disabled" | "size" | "variant" | "aria-label" | "children"
>;

// TODO: Disable this button when no models are available (see ../../input/no-model-section.tsx for example)
export const RetryButton = ({ messageId, className, ...props }: RetryButtonProps) => {
  const { regenerate } = useChatFunctions();
  const { status } = useChatStatus();

  const isDisabled = status === "streaming" || status === "submitted";

  const handleRetry = () => {
    if (!isDisabled) {
      void regenerate({ messageId });
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={isDisabled}
      className={className}
      size="icon-sm"
      variant="secondary"
      aria-label="Regenerate response"
      {...props}
    >
      <IconRefresh data-icon="inline-start" />
    </Button>
  );
};
