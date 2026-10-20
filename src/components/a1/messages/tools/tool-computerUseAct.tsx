import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconPointer,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import type { ComputerUseActOutput } from "@/lib/ai/tools/computerUseAct";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ComputerUseActInput {
  app?: string;
  summary?: string;
  action?: string;
  elementIndex?: number;
  x?: number;
  y?: number;
  toX?: number;
  toY?: number;
  text?: string;
  key?: string;
  direction?: string;
  amount?: number;
  clickCount?: number;
  button?: string;
}

function describeTarget(input: ComputerUseActInput) {
  if (input.elementIndex !== undefined) return `element ${input.elementIndex}`;
  if (input.x !== undefined && input.y !== undefined) return `point (${input.x}, ${input.y})`;
  return "the window";
}

function describeAction(input: ComputerUseActInput) {
  switch (input.action) {
    case "openApp":
      return `Open ${input.app ?? "an app"}`;
    case "click": {
      const kind =
        input.clickCount === 2
          ? "Double-click"
          : input.button === "right"
            ? "Right-click"
            : "Click";
      return `${kind} ${describeTarget(input)}`;
    }
    case "typeText":
      return input.elementIndex !== undefined
        ? `Type into element ${input.elementIndex}`
        : "Type text";
    case "pressKey":
      return `Press ${input.key ?? input.text ?? "a key"}`;
    case "scroll":
      return `Scroll ${input.direction ?? ""} over ${describeTarget(input)}`;
    case "drag":
      return `Drag from (${input.x}, ${input.y}) to (${input.toX}, ${input.toY})`;
    case "setValue":
      return `Set the value of element ${input.elementIndex ?? "?"}`;
    case "performAction":
      return `Run "${input.text ?? "an action"}" on element ${input.elementIndex ?? "?"}`;
    default:
      return `Use ${input.app ?? "an app"}`;
  }
}

function ActionDetails({
  input,
  summary,
  message,
}: {
  input: ComputerUseActInput;
  summary?: string;
  message?: string;
}) {
  const text = input.action === "typeText" || input.action === "setValue" ? input.text : undefined;
  return (
    <div className="flex flex-col gap-1">
      {summary ? <span>{summary}</span> : null}
      {message ? null : <span className="text-muted-foreground">{describeAction(input)}</span>}
      {text ? (
        <pre className="bg-muted max-h-40 overflow-auto rounded-md p-2 font-mono text-xs whitespace-pre-wrap">
          {text}
        </pre>
      ) : null}
      {message ? <span className="text-muted-foreground">{message}</span> : null}
    </div>
  );
}

function Denied({ callId }: { callId: string }) {
  return (
    <div key={callId} className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
      <IconCircleX className="size-4 shrink-0" />
      App action denied
    </div>
  );
}

export const MessagePartToolComputerUseAct = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as ComputerUseActInput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainOpen, setIsMainOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const summary = input.summary?.trim() || describeAction(input);
  const app = input.app ?? "an app";

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1 text-sm font-bold">
            <IconPointer className="text-foreground size-4 shrink-0" />
            <span className="truncate">
              {input.action === "openApp"
                ? `AgentOne wants to open ${app}`
                : `AgentOne wants to use ${app}`}
            </span>
          </div>
          {input.action !== "openApp" ? (
            <div className="text-sm">
              <ActionDetails input={input} summary={input.summary?.trim()} />
            </div>
          ) : null}
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
      return <Denied callId={callId} />;
    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) return <Denied callId={callId} />;
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span className="truncate">{summary}</span>
        </div>
      );
    }
    case "output-available": {
      const output = part.output as ComputerUseActOutput | undefined;
      return (
        <Accordion
          key={callId}
          type="single"
          collapsible
          value={isMainOpen ? callId : ""}
          onValueChange={(value) => setIsMainOpen(value === callId)}
          className="flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/computer-use-act border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainOpen && "border border-b! w-full max-w-2xl p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconPointer
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/computer-use-act:scale-0 group-hover/computer-use-act:opacity-0",
                      isMainOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/computer-use-act:scale-100 group-hover/computer-use-act:opacity-100",
                      isMainOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">{summary}</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <ActionDetails input={input} message={output?.message} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
          title={`Couldn't ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`}
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

MessagePartToolComputerUseAct.displayName = "MessagePartToolComputerUseAct";
