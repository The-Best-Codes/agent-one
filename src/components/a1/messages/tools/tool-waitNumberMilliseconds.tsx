import type { ToolUIPart } from "ai";
import {
  ChevronDownIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

interface WaitNumberMillisecondsInput {
  milliseconds: number;
}

interface WaitNumberMillisecondsToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolWaitNumberMilliseconds = ({
  part,
}: WaitNumberMillisecondsToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as WaitNumberMillisecondsInput;
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<
    boolean | undefined
  >();

  const safeFormatMilliseconds = (milliseconds: number) => {
    try {
      if (isNaN(milliseconds) || milliseconds < 0) {
        return "unknown";
      }

      const totalSeconds = Math.floor(milliseconds / 1000);
      const remainingMilliseconds = milliseconds % 1000;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;

      const formatted = [];

      if (totalMinutes > 0) formatted.push(`${totalMinutes}m`);
      if (remainingSeconds > 0) formatted.push(`${remainingSeconds}s`);
      if (remainingMilliseconds > 0 || formatted.length === 0)
        formatted.push(`${remainingMilliseconds}ms`);

      return formatted.join(" ");
    } catch (error) {
      logger.error(error);
      return "unknown";
    }
  };

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          </div>
          <span className="text-foreground text-sm font-bold">
            Waiting a bit...
          </span>
        </div>
      );

    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          <span className="max-w-2xl truncate">
            Waiting {safeFormatMilliseconds(input?.milliseconds)}...
          </span>
        </div>
      );

    case "output-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <ClockIcon className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Waited {safeFormatMilliseconds(input?.milliseconds)}
          </span>
        </div>
      );

    case "output-error":
      if (part.errorText === "agent-one::cancelled-by-user") {
        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Wait cancelled
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
              "group/wait-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <XCircleIcon
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/wait-accordion:scale-0 group-hover/wait-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <ChevronDownIcon
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/wait-accordion:scale-100 group-hover/wait-accordion:opacity-100",
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
                An error occurred while waiting
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
        <div key={callId} className="flex items-center gap-1">
          <ClockIcon className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            Unknown waitNumberMilliseconds tool state
          </span>
        </div>
      );
  }
};

MessagePartToolWaitNumberMilliseconds.displayName =
  "MessagePartToolWaitNumberMilliseconds";
