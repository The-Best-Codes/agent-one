import { IconCalendarX, IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface DeleteScheduledAgentInput {
  id?: string;
}

export const MessagePartToolDeleteScheduledAgent = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as DeleteScheduledAgentInput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const shortLabel = input.id ? ` “${input.id}”` : "";

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconCalendarX className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {`AgentOne wants to delete scheduled agent${shortLabel}`}
            </span>
          </div>
          {input.id && (
            <code className="bg-secondary text-foreground rounded px-2 py-1 font-mono text-xs break-all">
              {input.id}
            </code>
          )}
          <div className="flex items-center justify-end gap-2">
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
        <div
          key={callId}
          className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
        >
          <IconCircleX className="size-4 shrink-0" />
          Delete scheduled agent denied
        </div>
      );
    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false)
        return (
          <div
            key={callId}
            className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            Delete scheduled agent denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>{`Deleting scheduled agent${shortLabel}`}</span>
        </div>
      );
    }
    case "output-available":
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconCalendarX className="size-4 shrink-0" />
          <span>{`Deleted scheduled agent${shortLabel}`}</span>
        </div>
      );
    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL)
        return (
          <div
            key={callId}
            className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            Cancelled
          </div>
        );
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorOpen}
          onOpenChange={setIsErrorOpen}
          title="Error deleting scheduled agent"
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconCalendarX className="size-4 shrink-0" />
          Scheduled agent tool accessed
        </div>
      );
  }
};

MessagePartToolDeleteScheduledAgent.displayName = "MessagePartToolDeleteScheduledAgent";
