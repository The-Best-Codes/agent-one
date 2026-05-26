import {
  IconBrain,
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
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
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MemoryToolInput {
  operation: "add" | "remove" | "replace";
  entries?: string[];
  oldEntry?: string;
  newEntry?: string;
}

interface MemoryToolOutput {
  action: "add" | "remove" | "replace";
  added?: string[];
  removed?: string[];
  replaced?: boolean;
  oldEntry?: string;
  newEntry?: string;
  summary?: string;
}

interface MemoryToolPartProps {
  part: ToolUIPart;
}

function getActionLabel(input: MemoryToolInput) {
  switch (input.operation) {
    case "add":
      return "Updating memory...";
    case "remove":
      return "Pruning memory...";
    case "replace":
      return "Refreshing memory...";
  }
}

function formatOutput(output: MemoryToolOutput) {
  const details: string[] = [];

  if (output.added?.length) {
    details.push(`Added:\n${output.added.map((entry) => `- ${entry}`).join("\n")}`);
  }

  if (output.removed?.length) {
    details.push(`Removed:\n${output.removed.map((entry) => `- ${entry}`).join("\n")}`);
  }

  if (output.action === "replace") {
    details.push(`Replaced: ${output.replaced ? "yes" : "no"}`);
    if (output.oldEntry) details.push(`Old: ${output.oldEntry}`);
    if (output.newEntry) details.push(`New: ${output.newEntry}`);
  }

  if (output.summary) {
    details.push(output.summary);
  }

  return details.join("\n\n") || "Memory updated.";
}

function getCompletedLabel(output: MemoryToolOutput) {
  switch (output.action) {
    case "add":
      return output.added?.length
        ? `Saved ${output.added.length} memory entr${output.added.length === 1 ? "y" : "ies"}`
        : "Memory unchanged";
    case "remove":
      return output.removed?.length
        ? `Removed ${output.removed.length} memory entr${output.removed.length === 1 ? "y" : "ies"}`
        : "Memory unchanged";
    case "replace":
      return output.replaced ? "Updated memory entry" : "Memory unchanged";
  }
}

export const MessagePartToolMemory = ({ part }: MemoryToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as MemoryToolInput;
  const output = part.output as MemoryToolOutput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconBrain className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to update memory
            </span>
          </div>
          <pre className="text-muted-foreground overflow-x-auto rounded text-xs whitespace-pre-wrap">
            {JSON.stringify(input, null, 2)}
          </pre>
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
          <span className="text-muted-foreground text-sm font-bold">Memory update denied</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Preparing memory update...</span>
        </div>
      );

    case "approval-responded":
    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">{getActionLabel(input)}</span>
        </div>
      );

    case "output-available":
      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/memory-tool-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconBrain
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/memory-tool-accordion:scale-0 group-hover/memory-tool-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/memory-tool-accordion:scale-100 group-hover/memory-tool-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">{getCompletedLabel(output)}</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                {formatOutput(output)}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">Memory update cancelled</span>
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
              "group/memory-tool-error-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/memory-tool-error-accordion:scale-0 group-hover/memory-tool-error-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/memory-tool-error-accordion:scale-100 group-hover/memory-tool-error-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Memory update failed</span>
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
        <div key={callId} className="flex items-center gap-1">
          <IconBrain className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Memory updated</span>
        </div>
      );
  }
};

MessagePartToolMemory.displayName = "MessagePartToolMemory";
