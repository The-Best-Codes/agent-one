import type { UIMessage } from "ai";

import { CopyButton } from "@/components/a1/copy-button";
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { BranchButton } from "./branch-button";
import { EditButton } from "./edit-button";
import { RetryButton } from "./retry-button";

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
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </TooltipRoot>
        {onBranch && messageRole === "assistant" && (
          <TooltipRoot>
            <TooltipTrigger asChild>
              <BranchButton onBranch={onBranch} className="size-6" />
            </TooltipTrigger>
            <TooltipContent>Duplicate conversation from here</TooltipContent>
          </TooltipRoot>
        )}
        {messageRole === "assistant" && (
          <TooltipRoot>
            <TooltipTrigger asChild>
              <RetryButton messageId={messageId} className="size-6" />
            </TooltipTrigger>
            <TooltipContent>Regenerate message</TooltipContent>
          </TooltipRoot>
        )}
        {onEdit && (
          <TooltipRoot>
            <TooltipTrigger asChild>
              <EditButton onEdit={onEdit} className="size-6" />
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </TooltipRoot>
        )}
      </TooltipProvider>
    </div>
  );
};
