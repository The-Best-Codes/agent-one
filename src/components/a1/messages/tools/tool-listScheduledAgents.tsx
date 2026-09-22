import { IconCalendar, IconChevronDown, IconCircleX, IconList } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ScheduledAgentSummary {
  id?: string;
  title?: string;
  schedule?: string;
  enabled?: boolean;
  prompt?: string;
}

const parseOutput = (output: unknown): ScheduledAgentSummary[] => {
  if (Array.isArray(output)) return output as ScheduledAgentSummary[];
  if (
    output &&
    typeof output === "object" &&
    Array.isArray((output as { agents?: unknown }).agents)
  )
    return (output as { agents: ScheduledAgentSummary[] }).agents;
  return [];
};

export const MessagePartToolListScheduledAgents = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const output = part.output as unknown;
  const [isMainOpen, setIsMainOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconList className="text-foreground size-4 shrink-0" />
          <span>AgentOne wants to list scheduled agents</span>
        </div>
      );
    case "output-denied":
      return (
        <div
          key={callId}
          className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
        >
          <IconCircleX className="size-4 shrink-0" />
          List scheduled agents denied
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
            List scheduled agents denied
          </div>
        );
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span>Listing scheduled agents</span>
        </div>
      );
    }
    case "output-available": {
      const agents = parseOutput(output);
      if (agents.length === 0)
        return (
          <div key={callId} className="flex items-center gap-1 text-sm font-bold">
            <IconList className="size-4 shrink-0" />
            <span>No scheduled agents</span>
          </div>
        );
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
              "group/sched-list border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainOpen && "border border-b! w-full max-w-2xl p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconList
                    className={cn(
                      "absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/sched-list:scale-0 group-hover/sched-list:opacity-0",
                      isMainOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/sched-list:scale-100 group-hover/sched-list:opacity-100",
                      isMainOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate tabular-nums">
                {`Listed ${agents.length} scheduled agent${agents.length === 1 ? "" : "s"}`}
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="flex flex-col gap-2">
                {agents.map((agent, index) => (
                  <div key={agent.id ?? index} className="flex items-start gap-1.5">
                    <IconCalendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-foreground truncate text-sm font-bold">
                        {agent.title ?? agent.id ?? `Agent ${index + 1}`}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs break-all">
                        {[agent.schedule, agent.enabled === false ? "disabled" : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
          title="Error listing scheduled agents"
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconList className="size-4 shrink-0" />
          Scheduled agent tool accessed
        </div>
      );
  }
};

MessagePartToolListScheduledAgents.displayName = "MessagePartToolListScheduledAgents";
