import { GitBranch } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

type BranchButtonProps = {
  onBranch: () => void;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "disabled" | "size" | "variant" | "aria-label" | "children"
>;

export const BranchButton = ({
  onBranch,
  className,
  ...props
}: BranchButtonProps) => {
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
      {...props}
    >
      <GitBranch />
    </Button>
  );
};
