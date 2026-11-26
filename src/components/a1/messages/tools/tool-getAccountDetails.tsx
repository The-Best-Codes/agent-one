import { IconCircleCheck, IconCircleX, IconUserCircle, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface GetAccountDetailsOutput {
  signedIn: boolean;
  plan?: string;
  credits?: { remaining: number } | null;
}

function getSummary(output: GetAccountDetailsOutput | undefined) {
  if (!output?.signedIn) return "Checked account details: not signed in";
  const credits = output.credits
    ? `, ${output.credits.remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} credits left`
    : "";
  return `Checked account details: ${output.plan} plan${credits}`;
}

const Denied = () => (
  <div className="flex items-center gap-1">
    <IconCircleX className="text-muted-foreground size-4 shrink-0" />
    <span className="text-muted-foreground text-sm font-bold">Checking account details denied</span>
  </div>
);

export const MessagePartToolGetAccountDetails = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-fit max-w-full flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconUserCircle className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to check your plan and credits
            </span>
          </div>
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
      return <Denied />;

    case "output-available":
      return (
        <div key={callId} className="text-foreground flex items-center gap-1 text-sm font-bold">
          <IconUserCircle className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            {getSummary(part.output as GetAccountDetailsOutput)}
          </span>
        </div>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Checking account details was cancelled
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
          title="Error checking account details"
        />
      );

    default:
      if (part.approval?.approved === false) return <Denied />;
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner />
          <span className="max-w-2xl truncate">Checking account details...</span>
        </div>
      );
  }
};

MessagePartToolGetAccountDetails.displayName = "MessagePartToolGetAccountDetails";
