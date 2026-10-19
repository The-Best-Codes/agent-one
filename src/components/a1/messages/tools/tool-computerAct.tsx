import { IconCircleCheck, IconCircleX, IconPointer, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import type { ComputerActOutput } from "@/lib/ai/tools/computerAct";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ComputerActInput {
  app?: string;
  summary?: string;
  action?: string;
  elementIndex?: number;
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  direction?: string;
  clickCount?: number;
  button?: string;
}

const MAX_PREVIEW_CHARS = 80;

function preview(text: string) {
  return text.length > MAX_PREVIEW_CHARS ? `${text.slice(0, MAX_PREVIEW_CHARS)}…` : text;
}

function describeTarget(input: ComputerActInput) {
  if (input.elementIndex !== undefined) return `element ${input.elementIndex}`;
  if (input.x !== undefined && input.y !== undefined) return `(${input.x}, ${input.y})`;
  return "the window";
}

function describeAction(input: ComputerActInput) {
  const app = input.app ? ` in ${input.app}` : "";
  switch (input.action) {
    case "click": {
      const kind =
        input.clickCount === 2
          ? "double-click"
          : input.button === "right"
            ? "right-click"
            : "click";
      return `${kind} ${describeTarget(input)}${app}`;
    }
    case "typeText":
      return `type "${preview(input.text ?? "")}"${app}`;
    case "pressKey":
      return `press ${input.key ?? input.text ?? "a key"}${app}`;
    case "scroll":
      return `scroll ${input.direction ?? ""} over ${describeTarget(input)}${app}`;
    case "drag":
      return `drag from ${describeTarget(input)}${app}`;
    case "setValue":
      return `set element ${input.elementIndex ?? "?"} to "${preview(input.text ?? "")}"${app}`;
    case "performAction":
      return `${input.text ?? "run an action on"} element ${input.elementIndex ?? "?"}${app}`;
    default:
      return `use ${input.app ?? "an app"}`;
  }
}

export const ToolApprovalCard = ({
  approvalId,
  icon,
  title,
}: {
  approvalId: string;
  icon: ReactNode;
  title: string;
}) => {
  const approvalHandler = useChatApprovalHandler();
  return (
    <div className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-foreground text-sm font-bold">{title}</span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => approvalHandler?.({ id: approvalId, approved: false })}
        >
          <IconX data-icon="inline-start" />
          Deny
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => approvalHandler?.({ id: approvalId, approved: true })}
        >
          <IconCircleCheck data-icon="inline-start" />
          Approve
        </Button>
      </div>
    </div>
  );
};

export const MessagePartToolComputerAct = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as ComputerActInput;
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const description = describeAction(input);
  const summary = input.summary?.trim() || description;

  switch (part.state) {
    case "approval-requested":
      return (
        <ToolApprovalCard
          approvalId={part.approval.id}
          icon={<IconPointer className="text-foreground size-4 shrink-0" />}
          title={
            input.summary?.trim()
              ? `AgentOne wants to use ${input.app ?? "an app"}: ${input.summary.trim()}`
              : `AgentOne wants to ${description}`
          }
        />
      );
    case "output-denied":
      return (
        <div
          key={callId}
          className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
        >
          <IconCircleX className="size-4 shrink-0" />
          App action denied
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
            App action denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span className="first-letter:uppercase">{summary}</span>
        </div>
      );
    }
    case "output-available": {
      const output = part.output as ComputerActOutput | undefined;
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconPointer className="size-4 shrink-0" />
          <span className="first-letter:uppercase">
            {input.summary?.trim() || output?.message || "Done"}
          </span>
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
          title={`Couldn't ${description}`}
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconPointer className="size-4 shrink-0" />
          Computer use tool accessed
        </div>
      );
  }
};

MessagePartToolComputerAct.displayName = "MessagePartToolComputerAct";
