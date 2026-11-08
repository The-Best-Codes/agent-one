import { IconBug, IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface SendFeedbackInput {
  category?: string;
  summary?: string;
  details?: string;
  toolName?: string;
  errorMessage?: string;
}

export const MessagePartToolSendFeedback = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as SendFeedbackInput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const summary = input.summary || "a problem";

  const deniedRow = (
    <div key={callId} className="flex items-center gap-1">
      <IconCircleX className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground text-sm font-bold">Problem report not sent</span>
    </div>
  );

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-fit max-w-full flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconBug className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to report a problem to the developers
            </span>
          </div>
          <div className="flex max-w-2xl flex-col gap-1 text-sm">
            <span className="text-foreground wrap-break-word">{summary}</span>
            {input.toolName && (
              <span className="text-muted-foreground wrap-break-word">{`Tool: ${input.toolName}`}</span>
            )}
            {input.details && (
              <p className="text-muted-foreground max-h-40 overflow-y-auto wrap-break-word whitespace-pre-wrap">
                {input.details}
              </p>
            )}
            {input.errorMessage && (
              <pre className="bg-muted text-muted-foreground max-h-32 overflow-auto rounded-sm p-1 text-xs whitespace-pre-wrap">
                {input.errorMessage}
              </pre>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: false })}
            >
              <IconX data-icon="inline-start" />
              Don't send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              Send
            </Button>
          </div>
        </div>
      );

    case "output-denied":
      return deniedRow;

    case "input-streaming":
    case "approval-responded":
    case "input-available":
      if (part.approval?.approved === false) {
        return deniedRow;
      }
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">Reporting a problem...</span>
        </div>
      );

    case "output-available":
      return (
        <div key={callId} className="text-foreground flex items-center gap-1 text-sm font-bold">
          <IconBug className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">{`Reported: ${summary}`}</span>
        </div>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Problem report was cancelled
            </span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title="Error reporting problem"
        />
      );

    default:
      return null;
  }
};

MessagePartToolSendFeedback.displayName = "MessagePartToolSendFeedback";
