import { IconCircleX, IconEye } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import type { ComputerObserveOutput } from "@/lib/ai/tools/computerObserve";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolApprovalCard } from "./tool-computerAct";
import { ToolErrorAccordion } from "./tool-error-accordion";

interface ComputerObserveInput {
  app?: string;
  includeScreenshot?: boolean;
}

export const MessagePartToolComputerObserve = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as ComputerObserveInput;
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const target = input.app ? input.app : "your open apps";

  switch (part.state) {
    case "approval-requested":
      return (
        <ToolApprovalCard
          approvalId={part.approval.id}
          icon={<IconEye className="text-foreground size-4 shrink-0" />}
          title={`AgentOne wants to look at ${target}`}
        />
      );
    case "output-denied":
      return (
        <div
          key={callId}
          className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
        >
          <IconCircleX className="size-4 shrink-0" />
          Looking at apps denied
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
            Looking at apps denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>{`Looking at ${target}`}</span>
        </div>
      );
    }
    case "output-available": {
      const output = part.output as ComputerObserveOutput | undefined;
      const screenshot = output?.kind === "state" ? output.state.screenshot : undefined;
      const label =
        output?.kind === "apps"
          ? `Found ${output.apps.length} open apps`
          : `Looked at ${output?.state.app ?? target}`;
      return (
        <div key={callId} className="flex flex-col gap-2">
          <div className="flex items-center gap-1 text-sm font-bold">
            <IconEye className="size-4 shrink-0" />
            <span>{label}</span>
          </div>
          {screenshot ? (
            <img
              src={`data:${screenshot.mediaType};base64,${screenshot.data}`}
              alt={`Screenshot of ${output?.kind === "state" ? output.state.app : target}`}
              className="border-border max-h-64 w-fit max-w-full rounded-md border object-contain"
            />
          ) : null}
        </div>
      );
    }
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
          title={`Couldn't look at ${target}`}
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconEye className="size-4 shrink-0" />
          Computer use tool accessed
        </div>
      );
  }
};

MessagePartToolComputerObserve.displayName = "MessagePartToolComputerObserve";
