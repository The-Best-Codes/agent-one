import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconTool,
  IconX,
} from "@tabler/icons-react";
import type { DynamicToolUIPart } from "ai";
import { useAtomValue } from "jotai";
import { useState } from "react";

import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import {
  Accordion as ParametersAccordion,
  AccordionContent as ParametersAccordionContent,
  AccordionItem as ParametersAccordionItem,
  AccordionTrigger as ParametersAccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { maxToolResultCharsAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

type DynamicToolOutputContentItem = {
  text?: string;
};
interface DynamicToolOutput {
  isError?: boolean;
  content?: DynamicToolOutputContentItem[];
}

interface DynamicToolPartProps {
  part: DynamicToolUIPart;
}

export const MessagePartDynamicTool = ({ part }: DynamicToolPartProps) => {
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();
  const callId = part.toolCallId;
  const toolName = getToolDisplayName(part.toolName, part.title);
  const maxToolResultChars = useAtomValue(maxToolResultCharsAtom);
  const { addToolApprovalResponse } = useChatFunctions();

  switch (part.state) {
    case "approval-requested": {
      return (
        <div key={callId} className="border-border flex w-fit flex-col gap-2 rounded-md border p-2">
          <div className="flex items-center gap-1">
            <IconTool className="text-foreground size-4" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to run "{toolName}" tool
            </span>
          </div>
          {part?.input !== null && (
            <ParametersAccordion
              type="single"
              collapsible
              className="border-border w-full rounded-md border"
            >
              <ParametersAccordionItem value="parameters" className="border-0">
                <ParametersAccordionTrigger className="px-2 py-1.5 text-xs hover:no-underline">
                  <span className="text-muted-foreground font-medium">Parameters</span>
                </ParametersAccordionTrigger>
                <ParametersAccordionContent className="px-2 pb-2">
                  <pre className="text-muted-foreground overflow-x-auto text-xs">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </ParametersAccordionContent>
              </ParametersAccordionItem>
            </ParametersAccordion>
          )}
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
    }

    case "output-denied": {
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm font-bold">"{toolName}" tool denied</span>
        </div>
      );
    }

    case "approval-responded":
    case "input-streaming": {
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground" />
          <span className="text-foreground text-sm font-bold">Running "{toolName}" tool...</span>
        </div>
      );
    }
    case "input-available": {
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground" />
          <span className="max-w-2xl truncate">Running "{toolName}" tool...</span>
        </div>
      );
    }

    case "output-available": {
      const output = part.output as DynamicToolOutput;
      const hasError = output?.isError;
      const outputText = output ? JSON.stringify(output.content) : "No output";
      const isLongOutput = outputText.length > maxToolResultChars;

      if (hasError) {
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
                "group/dynamic-tool-error-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
                isErrorAccordionOpen && "border border-b! p-2",
              )}
            >
              <AccordionTrigger
                icon={
                  <div className="relative">
                    <IconCircleX
                      className={cn(
                        "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-error-accordion:scale-0 group-hover/dynamic-tool-error-accordion:opacity-0",
                        isErrorAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                    <IconChevronDown
                      className={cn(
                        "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-error-accordion:scale-100 group-hover/dynamic-tool-error-accordion:opacity-100",
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
                  "{toolName}" tool failed
                </span>
              </AccordionTrigger>
              <AccordionContent renderWhenCollapsed={!isLongOutput} className="p-0 pt-2">
                {isLongOutput ? (
                  <PerformantMarkdown maxHeight="200px" content={outputText} />
                ) : (
                  <div className="text-destructive/80 text-sm font-normal whitespace-pre-wrap">
                    {outputText}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      }

      return (
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/dynamic-tool-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconTool
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-accordion:scale-0 group-hover/dynamic-tool-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-accordion:scale-100 group-hover/dynamic-tool-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="items-center justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">"{toolName}" tool finished</span>
              {isLongOutput && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="size-2 shrink-0 rounded-full bg-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Tool result is over {maxToolResultChars} characters
                  </TooltipContent>
                </Tooltip>
              )}
            </AccordionTrigger>
            <AccordionContent
              renderWhenCollapsed={!isLongOutput}
              className="text-muted-foreground p-0 pt-2 text-xs"
            >
              <ScrollArea type="always" viewportClassName="max-h-96">
                <ScrollBar orientation="horizontal"></ScrollBar>
                <div className="flex flex-col gap-2">
                  {part?.input !== null && (
                    <div>
                      <span className="font-medium">Parameters:</span>
                      <pre className="mt-1 overflow-x-auto rounded bg-transparent p-2 text-xs">
                        {JSON.stringify(part.input, null, 2)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Result:</span>
                    <div className="mt-1 rounded bg-transparent p-2">
                      {isLongOutput ? (
                        <PerformantMarkdown maxHeight="200px" content={outputText} />
                      ) : (
                        <div className="whitespace-pre-wrap">{outputText}</div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error": {
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4" />
            <span className="text-muted-foreground text-sm font-bold">
              "{toolName}" tool cancelled
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
              "group/dynamic-tool-error-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-error-accordion:scale-0 group-hover/dynamic-tool-error-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-error-accordion:scale-100 group-hover/dynamic-tool-error-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">"{toolName}" tool error</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <div className="text-destructive/80 text-sm font-normal">
                {part?.errorText || "Unknown error"}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    default: {
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconCircleX className="text-destructive size-4" />
          <span className="text-destructive text-sm font-bold">
            Unknown "{toolName}" tool state
          </span>
        </div>
      );
    }
  }
};

MessagePartDynamicTool.displayName = "MessagePartDynamicTool";
