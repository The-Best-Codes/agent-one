import type { UIMessage } from "ai";
import { useAtom } from "jotai";

import { CopyButton } from "@/components/a1/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showMessageActionRowAtom } from "@/lib/jotai/settings-atoms";
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
  const [showMessageActionRow] = useAtom(showMessageActionRowAtom);

  return (
    <div
      className={cn(
        "ease mt-1 flex gap-1 transition-opacity duration-200",
        messageRole !== "user" && "ml-2",
        {
          "opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100":
            showMessageActionRow === "hover",
          "opacity-100": showMessageActionRow === "always",
          hidden: showMessageActionRow === "never",
        },
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<div />}>
            <>
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
            </>
          </TooltipTrigger>
          <TooltipContent>Copy message</TooltipContent>
        </Tooltip>

        {onBranch && messageRole === "assistant" && (
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <>
                <BranchButton onBranch={onBranch} className="size-6" />
              </>
            </TooltipTrigger>
            <TooltipContent>Branch conversation</TooltipContent>
          </Tooltip>
        )}
        {messageRole === "assistant" && (
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <>
                <RetryButton messageId={messageId} className="size-6" />
              </>
            </TooltipTrigger>
            <TooltipContent>Regenerate response</TooltipContent>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip>
            <TooltipTrigger render={<div />}>
              <>
                <EditButton onEdit={onEdit} className="size-6" />
              </>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};
