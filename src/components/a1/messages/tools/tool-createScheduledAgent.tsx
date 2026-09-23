import {
  IconCalendarPlus,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { ScheduledAgentSchedule } from "@/components/a1/scheduled-agent-schedule";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface CreateScheduledAgentInput {
  title?: string;
  schedule?: string;
  prompt?: string;
}

const Detail = ({ input }: { input: CreateScheduledAgentInput }) => (
  <div className="flex w-full flex-col gap-2">
    {input.schedule && (
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-sm">Schedule</span>
        <ScheduledAgentSchedule cron={input.schedule} className="text-foreground w-fit text-sm" />
      </div>
    )}
    {input.prompt && (
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-sm">Prompt</span>
        <span className="text-foreground text-sm wrap-break-word whitespace-pre-wrap">
          {input.prompt}
        </span>
      </div>
    )}
  </div>
);

export const MessagePartToolCreateScheduledAgent = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as CreateScheduledAgentInput;
  const output = part.output as CreateScheduledAgentInput | undefined;
  const approvalHandler = useChatApprovalHandler();
  const [isMainOpen, setIsMainOpen] = useState<boolean | undefined>();
  const [isApproveOpen, setIsApproveOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const shortTitle = input.title ? ` "${input.title}"` : "";
  const merged: CreateScheduledAgentInput = output ? { ...input, ...output } : { ...input };
  const doneTitle = output?.title ? ` "${output.title}"` : shortTitle;

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconCalendarPlus className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              {`AgentOne wants to create scheduled agent${shortTitle}`}
            </span>
          </div>
          <Accordion
            type="single"
            collapsible
            value={isApproveOpen ? callId : ""}
            onValueChange={(value) => setIsApproveOpen(value === callId)}
            className="flex flex-row bg-transparent p-0 text-sm"
          >
            <AccordionItem value={callId} className="border-0">
              <AccordionTrigger className="justify-start gap-1 p-0 text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-1">
                  <IconChevronDown className="size-3.5" />
                  {isApproveOpen ? "Hide details" : "Show details"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 pt-2">
                <Detail input={input} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
          Create scheduled agent denied
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
            Create scheduled agent denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>{`Creating scheduled agent${shortTitle}`}</span>
        </div>
      );
    }
    case "output-available":
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
              "group/sched-create border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainOpen && "border border-b! w-full max-w-2xl p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCalendarPlus
                    className={cn(
                      "absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/sched-create:scale-0 group-hover/sched-create:opacity-0",
                      isMainOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/sched-create:scale-100 group-hover/sched-create:opacity-100",
                      isMainOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">{`Created scheduled agent${doneTitle}`}</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <Detail input={merged} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
          title="Error creating scheduled agent"
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconCalendarPlus className="size-4 shrink-0" />
          Scheduled agent tool accessed
        </div>
      );
  }
};

MessagePartToolCreateScheduledAgent.displayName = "MessagePartToolCreateScheduledAgent";
