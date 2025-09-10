import type { ToolUIPart } from "ai";
import { CalendarDaysIcon, Loader2Icon, XCircleIcon } from "lucide-react";

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
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            Error getting date and time:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
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
