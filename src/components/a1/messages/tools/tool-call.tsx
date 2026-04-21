import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconTool,
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
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ToolCallPartProps {
  part: ToolUIPart;
}

export const MessagePartToolCall = ({ part }: ToolCallPartProps) => {
  const callId = part.toolCallId;
  const toolName = getToolDisplayName(part.type.replace("tool-", ""), part.title);
  const { addToolApprovalResponse } = useChatFunctions();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconTool className="text-foreground size-4" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to run tool "{toolName}"
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: false,
                })
              }
            >
              <IconX data-icon="inline-start" />
              Deny
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                addToolApprovalResponse({
                  id: part.approval.id,
                  approved: true,
                })
              }
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
          <IconCircleX className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm font-bold">Tool "{toolName}" denied</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-2">
          <Spinner className="text-destructive" />
          <span className="text-destructive text-sm font-bold">
            Running unknown tool "{toolName}"
          </span>
        </div>
      );

    case "approval-responded":
    case "input-available":
      return (
        <Accordion type="single" collapsible className="bg-secondary my-1 w-full rounded-md">
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <Spinner className="text-destructive" />
                <span className="max-w-2xl truncate">Running unknown tool "{toolName}"</span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              {part.input && typeof part.input === "object" ? (
                <div className="text-foreground/80 text-xs">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-transparent p-2 text-xs">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-available":
      return (
        <Accordion type="single" collapsible className="bg-secondary my-1 w-full rounded-md">
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <IconCircleX className="text-destructive" />
                <span className="max-w-2xl truncate">Unknown tool "{toolName}" finished</span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              <div className="text-foreground/80 text-sm">
                <div className="whitespace-pre-wrap">
                  Tool output:{" "}
                  {typeof part.output === "string"
                    ? part.output
                    : JSON.stringify(part.output, null, 2)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-2">
            <IconCircleX className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-bold">
              Tool "{toolName}" cancelled
            </span>
          </div>
        );
      }
      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsErrorAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/tool-call-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/tool-call-accordion:scale-0 group-hover/tool-call-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/tool-call-accordion:scale-100 group-hover/tool-call-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">
                Unknown tool "{toolName}" error
              </span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-destructive/80 text-sm font-normal">
                {part?.errorText || "Unknown error"}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-2">
          <IconCircleX className="text-destructive size-4" />
          <span className="text-destructive text-sm font-bold">Unknown tool "{toolName}"</span>
        </div>
      );
  }
};

MessagePartToolCall.displayName = "MessagePartToolCall";
