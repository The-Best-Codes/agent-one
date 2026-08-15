import {
  IconChevronDown,
  IconBrain,
  IconCircleCheck,
  IconCircleX,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

function getActionLabel(t: (key: string) => string, input: MemoryToolInput) {
  switch (input.operation) {
    case "add":
      return t("tools.updatingMemory");
    case "remove":
      return t("tools.pruningMemory");
    case "replace":
      return t("tools.refreshingMemory");
  }
}

function formatOutput(t: (key: string, opts?: Record<string, unknown>) => string, output: MemoryToolOutput) {
  const details: string[] = [];

  if (output.added?.length) {
    details.push(t("tools.memoryAdded", { entries: output.added.map((entry) => `- ${entry}`).join("\n") }));
  }

  if (output.removed?.length) {
    details.push(t("tools.memoryRemoved", { entries: output.removed.map((entry) => `- ${entry}`).join("\n") }));
  }

  if (output.action === "replace") {
    details.push(t("tools.memoryReplaced", { value: output.replaced ? t("tools.yes") : t("tools.no") }));
    if (output.oldEntry) details.push(t("tools.memoryOld", { value: output.oldEntry }));
    if (output.newEntry) details.push(t("tools.memoryNew", { value: output.newEntry }));
  }

  if (output.summary) {
    details.push(output.summary);
  }

  return details.join("\n\n") || t("tools.memoryUpdatedPeriod");
}

function getCompletedLabel(t: (key: string, opts?: Record<string, unknown>) => string, output: MemoryToolOutput) {
  switch (output.action) {
    case "add":
      return output.added?.length
        ? t("tools.savedMemoryEntries", { count: output.added.length })
        : t("tools.memoryUnchanged");
    case "remove":
      return output.removed?.length
        ? t("tools.removedMemoryEntries", { count: output.removed.length })
        : t("tools.memoryUnchanged");
    case "replace":
      return output.replaced ? t("tools.updatedMemoryEntry") : t("tools.memoryUnchanged");
  }
}

export const MessagePartToolMemory = ({ part }: MemoryToolPartProps) => {
  const { t } = useTranslation();
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
              {t("tools.wantsToUpdateMemory")}
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
              {t("common.deny")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => approvalHandler?.({ id: part.approval.id, approved: true })}
            >
              <IconCircleCheck data-icon="inline-start" />
              {t("common.approve")}
            </Button>
          </div>
        </div>
      );

    case "output-denied":
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground text-sm font-bold">{t("tools.memoryDenied")}</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.preparingMemory")}</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">{t("tools.memoryDenied")}</span>
          </div>
        );
      }
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">{getActionLabel(t, input)}</span>
        </div>
      );
    }

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
              <span className="max-w-2xl truncate">{getCompletedLabel(t, output)}</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                {formatOutput(t, output)}
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
            <span className="text-muted-foreground text-sm font-bold">{t("tools.memoryUpdateCancelled")}</span>
          </div>
        );
      }

      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title={t("tools.memoryError")}
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconBrain className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">{t("tools.memoryUpdated")}</span>
        </div>
      );
  }
};

MessagePartToolMemory.displayName = "MessagePartToolMemory";
