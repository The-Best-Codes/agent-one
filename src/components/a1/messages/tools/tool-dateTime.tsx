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
            <Loader2Icon className="h-4 w-4 animate-spin shrink-0 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Checking date and time...
          </span>
        </div>
      );

    case "input-available":
      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <Loader2Icon className="h-4 w-4 animate-spin shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">Checking date and time...</span>
        </p>
      );

    case "output-available":
      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">
            Checked date and time ({output?.formatted})
          </span>
        </p>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Error getting date and time:{" "}
            <span className="font-normal text-destructive/80">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown dateTime tool state
          </span>
        </div>
      );
  }
};
