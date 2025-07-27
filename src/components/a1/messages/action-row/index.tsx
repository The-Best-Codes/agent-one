import { CopyButton } from "@/components/a1/copy-button";
import { Button } from "@/components/ui/button";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { PencilIcon } from "lucide-react";
import { RetryButton } from "./retry-button";

export const MessageActionRow = ({
  contentToCopy,
  messageRole,
  messageId,
  onEdit,
}: {
  contentToCopy: string;
  messageRole: UIMessage["role"];
  messageId: UIMessage["id"];
  onEdit?: () => void;
}) => {
  const { status } = useChatStatus();
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div
      className={cn(
        "mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100 transition-opacity duration-300 ease flex gap-1",
        messageRole !== "user" && "ml-2",
      )}
    >
      <CopyButton
        className="size-6"
        variants={{
          idle: "secondary",
          copying: "secondary",
          success: "secondary",
          error: "secondary",
        }}
        text={contentToCopy}
      />
      {messageRole === "assistant" && (
        <RetryButton messageId={messageId} className="size-6" />
      )}
      {onEdit && (
        <Button
          onClick={onEdit}
          disabled={isStreaming}
          className="size-6"
          size="icon"
          variant="secondary"
          aria-label="Edit message"
        >
          <PencilIcon />
        </Button>
      )}
    </div>
  );
};
