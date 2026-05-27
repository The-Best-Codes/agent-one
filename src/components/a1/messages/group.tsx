import type { UIMessage } from "ai";

import { cn } from "@/lib/utils";

import { MessageActionRow } from "./action-row";

export const MessageGroup = ({
  children,
  messageRole,
  contentToCopy,
  contentToSpeak,
  showTts,
  messageId,
  onEdit,
  onBranch,
}: {
  children: React.ReactNode;
  messageRole: UIMessage["role"];
  contentToCopy: string;
  contentToSpeak: string;
  showTts: boolean;
  messageId: UIMessage["id"];
  onEdit?: () => void;
  onBranch?: () => void;
}) => {
  return (
    <div
      className={cn(
        "group/message flex flex-col wrap-anywhere",
        messageRole === "user" ? "max-w-3/4 items-end" : "max-w-full items-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-full flex-col gap-2 rounded-md",
          messageRole === "user" ? "bg-secondary text-secondary-foreground p-2" : "p-2 pr-0 pb-0",
        )}
      >
        {children}
      </div>
      <MessageActionRow
        contentToCopy={contentToCopy}
        contentToSpeak={contentToSpeak}
        showTts={showTts}
        messageRole={messageRole}
        messageId={messageId}
        onEdit={onEdit}
        onBranch={onBranch}
      />
    </div>
  );
};
