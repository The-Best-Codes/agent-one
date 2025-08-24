import { CopyButton } from "@/components/a1/copy-button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { EditButton } from "./edit-button";
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
  return (
    <div
      className={cn(
        "mt-1 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100 transition-opacity duration-200 ease flex gap-1",
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
      {onEdit && <EditButton onEdit={onEdit} className="size-6" />}
    </div>
  );
};
