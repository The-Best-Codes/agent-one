import type { ToolUIPart } from "ai";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
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
import { cn } from "@/lib/utils";

interface DateTimeOutput {
  dateTime: string;
  formatted: string;
}

interface DateTimeToolPartProps {
  part: ToolUIPart;
}

export const MessagePartToolDateTime = ({ part }: DateTimeToolPartProps) => {
  const callId = part.toolCallId;
  const output = part.output as DateTimeOutput;
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<
    boolean | undefined
  >();

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <div>
            <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
          </div>
          <span className="text-foreground text-sm font-bold">
            Checking date and time...
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
          <span className="max-w-2xl truncate">Checking date and time...</span>
        </div>
      );

    case "output-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <CalendarDaysIcon className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Checked date and time ({output?.formatted})
          </span>
        </div>
      );

    case "output-error":
      if (part.errorText === "agent-one::cancelled-by-user") {
        return (
          <div key={callId} className="flex items-center gap-1">
            <XCircleIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">
              Date and time check cancelled
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
              "group/date-time-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <XCircleIcon
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/date-time-accordion:scale-0 group-hover/date-time-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <ChevronDownIcon
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/date-time-accordion:scale-100 group-hover/date-time-accordion:opacity-100",
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
                Error getting date and time
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
          <CalendarDaysIcon className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">
            Unknown dateTime tool state
          </span>
        </div>
      );
  }
};

MessagePartToolDateTime.displayName = "MessagePartToolDateTime";
