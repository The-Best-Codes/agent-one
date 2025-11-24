import type { DynamicToolUIPart } from "ai";
import { useAtomValue } from "jotai";
import {
  ChevronDownIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<
    boolean | undefined
  >();
  const callId = part.toolCallId;
  const toolName = part.toolName;
  const maxToolResultChars = useAtomValue(maxToolResultCharsAtom);

  switch (part.state) {
    case "input-streaming": {
      return (
        <div key={callId} className="flex items-center gap-1">
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="text-foreground text-sm font-bold">
            Running "{toolName}" tool...
          </span>
        </div>
      );
    }
    case "input-available": {
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="max-w-2xl truncate">
            Running "{toolName}" tool...
          </span>
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
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-destructive size-4 shrink-0" />
            <span className="text-destructive text-sm font-bold">
              "{toolName}" tool failed
            </span>
          </div>
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
                  <WrenchIcon
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-accordion:scale-0 group-hover/dynamic-tool-accordion:opacity-0",
                      isMainAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <ChevronDownIcon
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/dynamic-tool-accordion:scale-100 group-hover/dynamic-tool-accordion:opacity-100",
                      isMainAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">
                "{toolName}" tool finished
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground p-0 pt-2 text-xs">
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
                        <PerformantMarkdown content={outputText} />
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
      if (part.errorText === "agent-one::cancelled-by-user") {
        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              "{toolName}" tool cancelled
            </span>
          </div>
        );
      }
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            "{toolName}" tool error:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );
    }

    default: {
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            Unknown "{toolName}" tool state
          </span>
        </div>
      );
    }
  }
};

MessagePartDynamicTool.displayName = "MessagePartDynamicTool";
