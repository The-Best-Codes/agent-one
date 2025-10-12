import type { UIMessage } from "ai";

import { CopyButton } from "@/components/a1/copy-button";
import { cn } from "@/lib/utils";

import { BranchButton } from "./branch-button";
import { EditButton } from "./edit-button";
import { RetryButton } from "./retry-button";

// Action row will have tooltips once we migrate to Base UI (when it goes stable)

export const MessageActionRow = ({
  contentToCopy,
  messageRole,
  messageId,
  onEdit,
  onBranch,
}: {
  contentToCopy: string;
  messageRole: UIMessage["role"];
  messageId: UIMessage["id"];
  onEdit?: () => void;
  onBranch?: () => void;
}) => {
  return (
    <div
      className={cn(
        "ease mt-1 flex gap-1 opacity-0 transition-opacity duration-200 group-hover/message:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
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

      {onBranch && messageRole === "assistant" && (
        <BranchButton onBranch={onBranch} className="size-6" />
      )}
      {messageRole === "assistant" && (
        <RetryButton messageId={messageId} className="size-6" />
      )}
      {onEdit && <EditButton onEdit={onEdit} className="size-6" />}
    </div>
  );
};
