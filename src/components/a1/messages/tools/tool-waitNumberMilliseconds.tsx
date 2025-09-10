import type { ToolUIPart } from "ai";
import { ClockIcon, Loader2Icon, XCircleIcon } from "lucide-react";

import { getLogger } from "@/lib/logger";

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
        <div key={callId} className="flex items-center gap-1">
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            An error occurred while waiting:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
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
