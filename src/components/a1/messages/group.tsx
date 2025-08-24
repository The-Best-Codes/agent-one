import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { MessageActionRow } from "./action-row";

export const MessageGroup = ({
  children,
  messageRole,
  contentToCopy,
  messageId,
  onEdit,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
  contentToCopy: string;
  messageId: UIMessage["id"];
  onEdit?: () => void;
}) => {
  return (
    <div
      className={cn(
        "group/message flex flex-col wrap-anywhere",
        messageRole === "user"
          ? "max-w-3/4 items-end"
          : "max-w-full items-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-full flex-col gap-2 rounded-md",
          messageRole === "user"
            ? "bg-secondary text-secondary-foreground p-2"
            : "p-2 pb-0",
        )}
      >
        {children}
      </div>
      <MessageActionRow
        contentToCopy={contentToCopy}
        messageRole={messageRole}
        messageId={messageId}
        onEdit={onEdit}
      />
    </div>
  );
};
