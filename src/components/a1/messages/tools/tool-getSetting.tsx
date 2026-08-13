import { IconCircleCheck, IconCircleX, IconSettings, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface GetSettingInput {
  key: string;
}

export const MessagePartToolGetSetting = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = part.input as GetSettingInput;
  const approvalHandler = useChatApprovalHandler();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  const key = input?.key || "unknown setting";

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconSettings className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to read the "{key}" setting
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
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">
            Read "{key}" setting denied
          </span>
        </div>
      );

    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Read "{key}" setting denied
            </span>
          </div>
        );
      }
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">Reading "{key}" setting...</span>
        </div>
      );
    }

    case "output-available": {
      return (
        <div key={callId} className="text-foreground flex items-center gap-1 text-sm font-bold">
          <IconSettings className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">Read "{key}" setting</span>
        </div>
      );
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Reading setting was cancelled
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
          title="Error reading setting"
        />
      );
    }

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconSettings className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Read setting accessed</span>
        </div>
      );
  }
};

MessagePartToolGetSetting.displayName = "MessagePartToolGetSetting";
