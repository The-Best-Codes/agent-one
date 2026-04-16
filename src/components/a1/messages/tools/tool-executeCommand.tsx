import "@xterm/xterm/css/xterm.css";
import {
  IconChevronDown,
  IconCircleCheck,
  IconCircleX,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import type { ToolUIPart } from "ai";
import { memo, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { useTheme } from "@/hooks/use-theme";
import type { ExecuteCommandOutput } from "@/lib/ai/tools/executeCommand";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ExecuteCommandInput {
  command: string;
  timeoutMs?: number;
}

interface ExecuteCommandToolPartProps {
  part: ToolUIPart;
}

const DARK_THEME = {
  background: "#1a1a2e",
  foreground: "#e0e0e0",
  cursor: "#e0e0e0",
  cursorAccent: "#1a1a2e",
  selectionBackground: "#3a3a5e",
};

const LIGHT_THEME = {
  background: "#fafafa",
  foreground: "#1a1a1a",
  cursor: "#1a1a1a",
  cursorAccent: "#fafafa",
  selectionBackground: "#c0c0d0",
};

const TerminalDisplay = memo(
  ({ command, output }: { command: string; output: ExecuteCommandOutput }) => {
    const termRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const lastWrittenLenRef = useRef<{ stdout: number; stderr: number }>({
      stdout: 0,
      stderr: 0,
    });
    const wroteCommandRef = useRef(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
      if (!termRef.current || xtermRef.current) return;

      const theme = resolvedTheme === "dark" ? DARK_THEME : LIGHT_THEME;
      const term = new Terminal({
        convertEol: true,
        fontFamily: "monospace",
        fontSize: 13,
        lineHeight: 1.2,
        theme,
        cursorBlink: false,
        cursorStyle: "bar",
        disableStdin: true,
        scrollback: 5000,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      return () => {
        term.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
        lastWrittenLenRef.current = { stdout: 0, stderr: 0 };
        wroteCommandRef.current = false;
      };
      // Only run once on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const term = xtermRef.current;
      if (!term) return;

      const theme = resolvedTheme === "dark" ? DARK_THEME : LIGHT_THEME;
      term.options.theme = theme;
    }, [resolvedTheme]);

    useEffect(() => {
      const term = xtermRef.current;
      if (!term || !output) return;

      if (!wroteCommandRef.current) {
        term.write(`\x1b[1;34m❯\x1b[0m \x1b[1m${command}\x1b[0m\r\n`);
        wroteCommandRef.current = true;
      }

      const prevStdout = lastWrittenLenRef.current.stdout;
      const prevStderr = lastWrittenLenRef.current.stderr;

      if (output.stdout.length > prevStdout) {
        term.write(output.stdout.slice(prevStdout));
        lastWrittenLenRef.current.stdout = output.stdout.length;
      }

      if (output.stderr.length > prevStderr) {
        term.write(output.stderr.slice(prevStderr));
        lastWrittenLenRef.current.stderr = output.stderr.length;
      }
    }, [output, command]);

    useEffect(() => {
      const fitAddon = fitAddonRef.current;
      const container = termRef.current;
      if (!fitAddon || !container) return;

      let lastWidth = container.clientWidth;
      let rafId: number | null = null;

      const observer = new ResizeObserver(() => {
        const newWidth = container.clientWidth;
        if (newWidth === lastWidth || newWidth === 0) return;
        lastWidth = newWidth;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          try {
            fitAddon.fit();
          } catch {
            // ignore fit errors during resize
          }
        });
      });

      observer.observe(container);

      return () => {
        observer.disconnect();
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, []);

    return (
      <div className="flex w-full flex-col">
        <div
          ref={termRef}
          className="border-border w-full overflow-hidden rounded border"
          style={{ minHeight: "120px", maxHeight: "400px" }}
        />
      </div>
    );
  },
);

TerminalDisplay.displayName = "TerminalDisplay";

export const MessagePartToolExecuteCommand = ({ part }: ExecuteCommandToolPartProps) => {
  const callId = part.toolCallId;
  const input = part.input as ExecuteCommandInput;
  const { addToolApprovalResponse } = useChatFunctions();
  const [isMainAccordionOpen, setIsMainAccordionOpen] = useState(true);
  const [isErrorAccordionOpen, setIsErrorAccordionOpen] = useState<boolean | undefined>();

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
    case "input-available":
      return (
        <div
          key={callId}
          className="text-foreground flex flex-row items-center gap-1 text-sm font-bold"
        >
          <Spinner className="text-foreground size-4 shrink-0" />
          <span className="max-w-2xl truncate">
            Running <code className="text-xs">{truncatedCommand}</code>...
          </span>
        </div>
      );

    case "output-available": {
      const output = part.output as ExecuteCommandOutput;
      const isPreliminary = (part as { preliminary?: boolean }).preliminary === true;

      return (
        <div key={callId} className="flex w-full max-w-3xl flex-col gap-1">
          <div className="flex items-center gap-1">
            {isPreliminary ? (
              <>
                <Spinner className="text-foreground size-4 shrink-0" />
                <span className="text-foreground text-sm font-bold">
                  Running <code className="text-xs">{truncatedCommand}</code>
                </span>
              </>
            ) : (
              <Accordion
                type="single"
                collapsible
                defaultValue={callId}
                onValueChange={(value) => setIsMainAccordionOpen(value === callId)}
                className="text-foreground flex w-full flex-row bg-transparent p-0 text-sm"
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
                        <IconTerminal2
                          className={cn(
                            "text-foreground absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-0 group-hover/exec-accordion:opacity-0",
                            isMainAccordionOpen && "scale-0 opacity-0",
                          )}
                        />
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
                      Ran <code className="text-xs">{truncatedCommand}</code>
                      {output.exitCode === 0
                        ? ""
                        : output.timedOut
                          ? " (timed out)"
                          : ` (exit code ${output.exitCode})`}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 pt-2">
                    <TerminalDisplay command={command} output={output} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
          {isPreliminary && <TerminalDisplay command={command} output={output} />}
        </div>
      );
    }

    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL) {
        const output = part.output as ExecuteCommandOutput | undefined;
        const hasPartialOutput = Boolean(output && (output.stdout || output.stderr));

        if (hasPartialOutput && output) {
          return (
            <div key={callId} className="flex w-full max-w-3xl flex-col gap-1">
              <div className="flex items-center gap-1">
                <IconCircleX className="text-muted-foreground size-4 shrink-0" />
                <span className="text-muted-foreground text-sm font-bold">
                  Cancelled <code className="text-xs">{truncatedCommand}</code>
                </span>
              </div>
              <TerminalDisplay command={command} output={output} />
            </div>
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
        <Accordion
          type="single"
          collapsible
          onValueChange={(value) => setIsErrorAccordionOpen(value === callId)}
          className="text-foreground flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/exec-accordion border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isErrorAccordionOpen && "border border-b! p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconCircleX
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-100 opacity-100 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-0 group-hover/exec-accordion:opacity-0",
                      isErrorAccordionOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-destructive absolute inset-0 size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/exec-accordion:scale-100 group-hover/exec-accordion:opacity-100",
                      isErrorAccordionOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="text-destructive max-w-2xl truncate">Error running command</span>
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
          <IconTerminal2 className="text-foreground size-4 shrink-0" />
          <span className="text-foreground text-sm font-bold">Command executed</span>
        </div>
      );
  }
};

MessagePartToolExecuteCommand.displayName = "MessagePartToolExecuteCommand";
