import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";

export const EditButton = ({
  className,
  onEdit,
}: {
  className?: string;
  onEdit: () => void;
}) => {
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <Button
      onClick={onEdit}
      disabled={isStreaming}
      className={className}
      size="icon"
      variant="secondary"
      aria-label="Edit message"
    >
      <PencilIcon />
    </Button>
  );
};
