import { IconCircleCheck, IconCircleX, IconClock, IconX, type Icon } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

export function ScheduledAgentToolUi({
  part,
  verb,
  active,
  complete,
  IconComponent = IconClock,
}: {
  part: ToolUIPart;
  verb: string;
  active: string;
  complete: string;
  IconComponent?: Icon;
}) {
  const approvalHandler = useChatApprovalHandler();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();
  const title = (part.input as { title?: string } | undefined)?.title;
  const detail = title ? ` “${title}”` : "";

  switch (part.state) {
    case "approval-requested":
      return (
        <div className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconComponent className="size-4 shrink-0" />
            <span className="text-sm font-bold">{`AgentOne wants to ${verb}${detail}`}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              Deny
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              Approve
            </Button>
          </div>
        </div>
      );
    case "output-denied":
      return (
        <div className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
          <IconCircleX className="size-4 shrink-0" />
          {`${verb} denied`}
        </div>
      );
    case "input-streaming":
    case "approval-responded":
    case "input-available":
      if (part.approval?.approved === false)
        return (
          <div className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
            <IconCircleX className="size-4 shrink-0" />
            {`${verb} denied`}
          </div>
        );
      return (
        <div className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>
            {active}
            {detail}
          </span>
        </div>
      );
    case "output-available":
      return (
        <div className="flex items-center gap-1 text-sm font-bold">
          <IconComponent className="size-4 shrink-0" />
          <span>
            {complete}
            {detail}
          </span>
        </div>
      );
    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL)
        return (
          <div className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
            <IconCircleX className="size-4 shrink-0" />
            Cancelled
          </div>
        );
      return (
        <ToolErrorAccordion
          callId={part.toolCallId}
          errorText={part.errorText}
          isOpen={isErrorOpen}
          onOpenChange={setIsErrorOpen}
          title={`Error trying to ${verb}`}
        />
      );
    default:
      return (
        <div className="flex items-center gap-1 text-sm font-bold">
          <IconComponent className="size-4 shrink-0" />
          Scheduled agent tool accessed
        </div>
      );
  }
}
