import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { MessageActionRow } from "./action-row";

export const MessageGroup = ({
  children,
  messageRole,
  contentToCopy,
  messageId,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
  contentToCopy: string;
  messageId: UIMessage["id"];
}) => {
  return (
    <div
      className={cn(
        "flex flex-col group wrap-anywhere",
        messageRole === "user"
          ? "max-w-3/4 items-end"
          : "max-w-full items-start",
      )}
    >
      <div
        className={cn(
          "rounded-md max-w-full",
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
      />
    </div>
  );
};
