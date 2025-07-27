import { getLogger } from "@/lib/logger";
import type { ToolUIPart } from "ai";
import { ClockIcon, Loader2Icon, XCircleIcon } from "lucide-react";

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
            <Loader2Icon className="size-4 animate-spin shrink-0 text-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">
            Waiting a bit...
          </span>
        </div>
      );

    case "input-available":
      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <Loader2Icon className="size-4 animate-spin shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">
            Waiting {safeFormatMilliseconds(input?.milliseconds)}...
          </span>
        </p>
      );

    case "output-available":
      return (
        <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
          <ClockIcon className="size-4 shrink-0 text-foreground" />
          <span className="max-w-2xl truncate">
            Waited {safeFormatMilliseconds(input?.milliseconds)}
          </span>
        </p>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="size-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            An error occurred while waiting:{" "}
            <span className="font-normal text-destructive/80">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <ClockIcon className="size-4 shrink-0 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown waitNumberMilliseconds tool state
          </span>
        </div>
      );
  }
};

MessagePartToolWaitNumberMilliseconds.displayName =
  "MessagePartToolWaitNumberMilliseconds";
