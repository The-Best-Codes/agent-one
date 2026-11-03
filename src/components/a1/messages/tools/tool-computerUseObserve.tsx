import { IconChevronDown, IconCircleCheck, IconCircleX, IconEye, IconX } from "@tabler/icons-react";
import type { ToolUIPart } from "ai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Spinner } from "@/components/ui/spinner";
import { useChatApprovalHandler } from "@/contexts/use-chat/chat-hooks";
import type { ComputerUseObserveOutput } from "@/lib/ai/tools/computerUseObserve";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ToolErrorAccordion } from "./tool-error-accordion";

interface ComputerUseObserveInput {
  view?: "runningApps" | "installedApps" | "app";
  app?: string;
  query?: string;
  includeScreenshot?: boolean;
}

function describeTarget(input: ComputerUseObserveInput) {
  switch (input.view) {
    case "runningApps":
      return "your open apps";
    case "installedApps":
      return input.query ? `installed apps matching "${input.query}"` : "your installed apps";
    default:
      return input.app ?? "an app";
  }
}

function Denied({ callId }: { callId: string }) {
  return (
    <div key={callId} className="text-muted-foreground flex items-center gap-1 text-sm font-bold">
      <IconCircleX className="size-4 shrink-0" />
      Looking at apps denied
    </div>
  );
}

function ObserveDetails({ output }: { output: ComputerUseObserveOutput }) {
  switch (output.kind) {
    case "running":
      return (
        <div className="flex flex-col gap-1">
          {output.apps.map((app) => (
            <div key={`${app.name}-${app.pid ?? ""}`} className="flex min-w-0 flex-col">
              <span className="truncate font-bold">{app.name}</span>
              {app.windows.length > 0 ? (
                <span className="text-muted-foreground truncate text-xs">
                  {app.windows.join(" · ")}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      );
    case "installed":
      if (output.apps.length === 0)
        return <span className="text-muted-foreground">No installed apps matched.</span>;
      return (
        <div className="flex flex-col gap-1">
          {output.apps.map((app) => (
            <span key={app.path} className="truncate">
              {app.name}
            </span>
          ))}
          {output.total > output.apps.length ? (
            <span className="text-muted-foreground text-xs">
              {`And ${output.total - output.apps.length} more`}
            </span>
          ) : null}
        </div>
      );
    case "state": {
      const { state } = output;
      return (
        <div className="flex flex-col gap-2">
          {state.screenshot ? (
            <img
              src={`data:${state.screenshot.mediaType};base64,${state.screenshot.data}`}
              alt={`Screenshot of ${state.app}`}
              className="border-border max-h-80 w-fit max-w-full rounded-md border object-contain"
            />
          ) : null}
          {state.screenshotError ? (
            <span className="text-destructive/80 text-xs">{`Screenshot failed: ${state.screenshotError}`}</span>
          ) : null}
          <span className="text-muted-foreground text-xs tabular-nums">
            {[
              state.window ? `Window "${state.window}"` : null,
              `${state.elementCount} elements${state.truncated ? " (truncated)" : ""}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <pre className="bg-muted max-h-64 overflow-auto rounded-md p-2 font-mono text-xs whitespace-pre">
            {state.tree}
          </pre>
        </div>
      );
    }
  }
}

function summarize(output: ComputerUseObserveOutput, fallback: string) {
  switch (output.kind) {
    case "running":
      return `Listed ${output.apps.length} open app${output.apps.length === 1 ? "" : "s"}`;
    case "installed":
      return output.query
        ? `Found ${output.total} installed app${output.total === 1 ? "" : "s"} matching "${output.query}"`
        : `Listed ${output.total} installed app${output.total === 1 ? "" : "s"}`;
    case "state":
      return `Looked at ${output.state.app || fallback}${output.state.screenshot ? " and took a screenshot" : ""}`;
  }
}

export const MessagePartToolComputerUseObserve = ({ part }: { part: ToolUIPart }) => {
  const callId = part.toolCallId;
  const input = (part.input ?? {}) as ComputerUseObserveInput;
  const approvalHandler = useChatApprovalHandler();
  const [isMainOpen, setIsMainOpen] = useState<boolean | undefined>();
  const [isErrorOpen, setIsErrorOpen] = useState<boolean | undefined>();

  const target = describeTarget(input);

  switch (part.state) {
    case "approval-requested":
      return (
        <div
          key={callId}
          className="border-border flex w-full max-w-2xl flex-col gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-1 text-sm font-bold">
            <IconEye className="text-foreground size-4 shrink-0" />
            <span className="truncate">{`AgentOne wants to look at ${target}`}</span>
          </div>
          {input.view === "app" && input.includeScreenshot ? (
            <span className="text-muted-foreground text-sm">
              This brings the window to the front and takes a screenshot.
            </span>
          ) : null}
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
      return <Denied callId={callId} />;
    case "input-streaming":
    case "approval-responded":
    case "input-available": {
      if (part.approval?.approved === false) return <Denied callId={callId} />;
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <Spinner className="size-4 shrink-0" />
          <span className="truncate">{`Looking at ${target}`}</span>
        </div>
      );
    }
    case "output-available": {
      const output = part.output as ComputerUseObserveOutput | undefined;
      if (!output)
        return (
          <div key={callId} className="flex items-center gap-1 text-sm font-bold">
            <IconEye className="size-4 shrink-0" />
            <span className="truncate">{`Looked at ${target}`}</span>
          </div>
        );
      return (
        <Accordion
          key={callId}
          type="single"
          collapsible
          value={isMainOpen ? callId : ""}
          onValueChange={(value) => setIsMainOpen(value === callId)}
          className="flex flex-row bg-transparent p-0 text-sm"
        >
          <AccordionItem
            value={callId}
            className={cn(
              "group/computer-use-observe border-border w-fit max-w-full rounded-md border-0 transition-[padding] duration-200",
              isMainOpen && "border border-b! w-full max-w-2xl p-2",
            )}
          >
            <AccordionTrigger
              icon={
                <div className="relative">
                  <IconEye
                    className={cn(
                      "text-foreground absolute inset-0 size-4 shrink-0 transition-[opacity,scale] duration-200 group-hover/computer-use-observe:scale-0 group-hover/computer-use-observe:opacity-0",
                      isMainOpen && "scale-0 opacity-0",
                    )}
                  />
                  <IconChevronDown
                    className={cn(
                      "text-foreground size-4 shrink-0 scale-0 opacity-0 transition-[opacity,scale] duration-200 group-hover/computer-use-observe:scale-100 group-hover/computer-use-observe:opacity-100",
                      isMainOpen && "scale-100 opacity-100",
                    )}
                  />
                </div>
              }
              iconPosition="left"
              shouldRotateIcon={true}
              className="justify-start gap-1 p-0 font-bold hover:no-underline"
            >
              <span className="max-w-2xl truncate">{summarize(output, target)}</span>
            </AccordionTrigger>
            <AccordionContent className="p-0 pt-2">
              <ObserveDetails output={output} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }
    case "output-error":
      if (part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL)
        return (
          <div
            key={callId}
            className="text-muted-foreground flex items-center gap-1 text-sm font-bold"
          >
            <IconCircleX className="size-4 shrink-0" />
            Cancelled
          </div>
        );
      return (
        <ToolErrorAccordion
          callId={callId}
          errorText={part.errorText}
          isOpen={isErrorOpen}
          onOpenChange={setIsErrorOpen}
          title={`Couldn't look at ${target}`}
        />
      );
    default:
      return (
        <div key={callId} className="flex items-center gap-1 text-sm font-bold">
          <IconEye className="size-4 shrink-0" />
          Computer use tool accessed
        </div>
      );
  }
};

MessagePartToolComputerUseObserve.displayName = "MessagePartToolComputerUseObserve";
