import { GitFork } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

export const ForkButton = ({
  className,
  onFork,
}: {
  className?: string;
  onFork: () => void;
}) => {
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <Button
      onClick={onFork}
      disabled={isStreaming}
      className={className}
      size="icon"
      variant="secondary"
      aria-label="Fork conversation from this message"
    >
      <GitFork />
    </Button>
  );
};
