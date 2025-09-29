import { GitBranch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

export const BranchButton = ({
  className,
  onBranch,
}: {
  className?: string;
  onBranch: () => void;
}) => {
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <Button
      onClick={onBranch}
      disabled={isStreaming}
      className={className}
      size="icon"
      variant="secondary"
      aria-label="Branch conversation from this message"
    >
      <GitBranch />
    </Button>
  );
};
