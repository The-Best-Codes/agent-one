import { IconBook, IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ListSkillsOutput {
  skills?: unknown[];
}

export const MessagePartToolListSkills = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const denied = (
    <div key={callId} className="flex items-center gap-1">
      <IconCircleX className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground text-sm font-bold">Looking for skills was denied</span>
    </div>
  );

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconBook className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to look for skills
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
      return denied;

    case "approval-responded":
    case "input-streaming":
    case "input-available":
      if (part.approval?.approved === false) return denied;
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Looking for skills...</span>
        </div>
      );

    case "output-available": {
      const count = (part.output as ListSkillsOutput | undefined)?.skills?.length ?? 0;
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBook className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            {count === 0
              ? "No skills found"
              : count === 1
                ? "Found 1 skill"
                : `Found ${count} skills`}
          </span>
        </div>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Looking for skills was cancelled
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
          title="Couldn't look for skills"
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBook className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Looked for skills</span>
        </div>
      );
  }
};

MessagePartToolListSkills.displayName = "MessagePartToolListSkills";
