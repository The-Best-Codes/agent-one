import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconPlayerSkipForward,
  IconPlayerStop,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { AnsiHtml } from "fancy-ansi/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import {
  getExecuteCommandLiveState,
  skipExecuteCommand,
  stopExecuteCommand,
  subscribeExecuteCommandLiveState,
  type ExecuteCommandOutput,
} from "@/lib/ai/tools/executeCommand";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ExecuteCommandInput {
  command: string;
  timeoutMs?: number;
}

interface ExecuteCommandToolPartProps {
  part: ToolUIPart;
}

const EMPTY_OUTPUT: ExecuteCommandOutput = {
  stdout: "",
  stderr: "",
  exitCode: null,
  signal: null,
  timedOut: false,
};

function applyCarriageReturns(text: string): string {
  let result = "";
  let lineBuffer = "";

  for (const char of text) {
    if (char === "\r") {
      lineBuffer = "";
      continue;
    }

    if (char === "\n") {
      result += `${lineBuffer}\n`;
      lineBuffer = "";
      continue;
    }

    lineBuffer += char;
  }

  return result + lineBuffer;
}

const TerminalDisplay = ({
  command,
  output,
}: {
  command: string;
  output: ExecuteCommandOutput;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const renderedOutput = applyCarriageReturns(`$ ${command}\n${output.stdout}${output.stderr}`);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPinnedToBottom) return;

    container.scrollTop = container.scrollHeight;
  }, [renderedOutput, isPinnedToBottom]);

  return (
    <div className="flex w-full flex-col">
      <div
        ref={scrollRef}
        className="border-border bg-card text-card-foreground max-h-80 w-full overflow-auto rounded-md border"
        onScroll={(event) => {
          const container = event.currentTarget;
          const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
          setIsPinnedToBottom(distanceFromBottom < 24);
        }}
      >
        <pre className="min-w-full p-3 font-mono text-sm leading-5 wrap-break-word whitespace-pre-wrap">
          <AnsiHtml className="block w-full" text={renderedOutput} />
        </pre>
      </div>
    </div>
  );
};

const LongRunningControls = ({ callId, showSkip }: { callId: string; showSkip: boolean }) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-xs"
              variant="destructive"
              className="size-5 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                stopExecuteCommand(callId);
              }}
            >
              <IconPlayerStop />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Stop command</TooltipContent>
        </Tooltip>
        {showSkip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-xs"
                variant="secondary"
                className="size-5 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  skipExecuteCommand(callId);
                }}
              >
                <IconPlayerSkipForward />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Skip command (leave it running in the background)
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export const MessagePartToolExecuteCommand = ({ part }: ExecuteCommandToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as ExecuteCommandInput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState<boolean | undefined>();
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();
  const [showLongRunningStop, setShowLongRunningStop] = useState(false);

  const liveState = useSyncExternalStore(
    (listener) => subscribeExecuteCommandLiveState(callId, listener),
    () => getExecuteCommandLiveState(callId),
    () => getExecuteCommandLiveState(callId),
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!liveState || liveState.status === "completed") {
      setShowLongRunningStop(false);
      return;
    }

    const elapsed = Date.now() - liveState.startedAt;
    if (elapsed >= 1000) {
      setShowLongRunningStop(true);
      return;
    }

    setShowLongRunningStop(false);

    const timeout = window.setTimeout(() => {
      setShowLongRunningStop(true);
    }, 1000 - elapsed);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [liveState]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const showLongRunningSkip =
    showLongRunningStop && liveState?.status === "running" && !liveState?.skipRequested;

  const command = input?.command || "unknown command";
  const truncatedCommand = command.length > 80 ? command.slice(0, 80) + "…" : command;

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1">
            <IconTerminal2 className="text-foreground size-4 shrink-0" />
            <span className="text-foreground text-sm font-bold">
              AgentOne wants to run a command
            </span>
          </div>
          <code className="bg-secondary text-foreground rounded px-2 py-1 text-xs break-all">
            {command}
          </code>
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
          <span className="text-muted-foreground text-sm font-bold">Command denied</span>
        </div>
      );

    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-1">
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Preparing command...</span>
        </div>
      );

    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) {
        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">Command denied</span>
          </div>
        );
      }
      return (
        <div
          key={callId}
          className="text-foreground flex max-w-2xl flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="truncate">
            Running <code className="text-xs">{truncatedCommand}</code>...
          </span>
          {showLongRunningStop && (
            <LongRunningControls callId={callId} showSkip={showLongRunningSkip} />
          )}
        </div>
      );
    }

    case "output-available": {
      const outputFromPart = (part.output as ExecuteCommandOutput | undefined) ?? EMPTY_OUTPUT;
      const isPreliminary = (part as { preliminary?: boolean }).preliminary === true;
      const showSpinnerIcon = isPreliminary || liveState?.status === "skipped-running";
      const output: ExecuteCommandOutput = liveState
        ? {
            stdout: liveState.stdout,
            stderr: liveState.stderr,
            exitCode: outputFromPart.exitCode ?? liveState.exitCode,
            signal: outputFromPart.signal ?? liveState.signal,
            timedOut: outputFromPart.timedOut || liveState.timedOut,
            skipped: outputFromPart.skipped ?? liveState.skipRequested,
            stopped:
              outputFromPart.stopped ??
              (liveState.stopRequested && !liveState.skipRequested ? true : undefined),
          }
        : outputFromPart;

      return (
        <Accordion
          key={callId}
          type="single"
          collapsible
          onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
          className="text-foreground flex max-w-3xl flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/exec-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
              isMainAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  {showSpinnerIcon ? (
                    <Spinner
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-0 group-hover/exec-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                  ) : (
                    <IconTerminal2
                      className={cn(
                        "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-0 group-hover/exec-accordion:opacity-0",
                        isMainAccordionOpen && "scale-0 opacity-0",
                      )}
                    />
                  )}
                  <IconChevronDown
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-100 group-hover/exec-accordion:opacity-100",
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
                {liveState?.status === "skipped-running"
                  ? "Skipped "
                  : isPreliminary
                    ? "Running "
                    : "Ran "}
                <code className="text-xs">{truncatedCommand}</code>
                {liveState?.status === "skipped-running"
                  ? " (backgrounded)"
                  : isPreliminary
                    ? ""
                    : output.timedOut
                      ? " (timed out)"
                      : output.stopped
                        ? " (stopped)"
                        : output.skipped
                          ? " (skipped)"
                          : output.exitCode && output.exitCode !== 0
                            ? ` (exit code ${output.exitCode})`
                            : ""}
              </span>
              {showLongRunningStop && (
                <LongRunningControls callId={callId} showSkip={showLongRunningSkip} />
              )}
            </AccordionTrigger>
            <AccordionContent className="w-full p-0 pt-2">
              <div className="flex flex-col gap-2">
                <TerminalDisplay command={command} output={output} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        const output = part.output as ExecuteCommandOutput | undefined;
        const hasPartialOutput = Boolean(output && (output.stdout || output.stderr));

        if (hasPartialOutput && output) {
          return (
            <Accordion
              key={callId}
              type="single"
              collapsible
              onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
              className="text-muted-foreground flex w-full max-w-3xl flex-row bg-transparent p-0 text-sm"
            >
              <AccordionItem
                value={callId}
                className={cn(
                  "group/exec-accordion border-border w-full rounded-md border-0 transition-[padding] duration-200",
                  isMainAccordionOpen && "border border-b! p-2",
                )}
              >
                <AccordionTrigger
                  icon={
                    <div className="relative">
                      <IconCircleX
                        className={cn(
                          "text-muted-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-0 group-hover/exec-accordion:opacity-0",
                          isMainAccordionOpen && "scale-0 opacity-0",
                        )}
                      />
                      <IconChevronDown
                        className={cn(
                          "text-muted-foreground absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-100 group-hover/exec-accordion:opacity-100",
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
                    Cancelled <code className="text-xs">{truncatedCommand}</code>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-0 pt-2">
                  <TerminalDisplay command={command} output={output} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        }

        return (
          <div key={callId} className="flex items-center gap-1">
            <IconCircleX className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground text-sm font-bold">Command cancelled</span>
          </div>
        );
      }
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorAccordionOpen}
          onOpenChange={setIsErrorAccordionOpen}
          title="Error running command"
        />
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-1">
          <IconTerminal2 className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Command executed</span>
        </div>
      );
  }
};

MessagePartToolExecuteCommand.displayName = "MessagePartToolExecuteCommand";
