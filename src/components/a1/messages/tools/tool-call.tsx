import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolUIPart } from "ai";
import { XCircleIcon } from "lucide-react";

interface ToolCallPartProps {
  part: ToolUIPart;
}

export const MessagePartToolCall = ({ part }: ToolCallPartProps) => {
  const callId = part.toolCallId;
  const toolName = part.type.replace("tool-", "");

  switch (part.state) {
    case "input-streaming":
      return (
        <div key={callId} className="flex items-center gap-2">
          <XCircleIcon className="size-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Unknown tool "{toolName}"
          </span>
        </div>
      );

    case "input-available":
      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-secondary my-1"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-destructive flex flex-row items-center gap-1">
                <XCircleIcon className="size-4 shrink-0 text-destructive" />
                <span className="max-w-2xl truncate">
                  Unknown tool executing "{toolName}"
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              {part.input && typeof part.input === "object" ? (
                <div className="text-xs text-foreground/80">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 bg-transparent p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-available":
      return (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-md bg-secondary my-1"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-sm font-bold text-destructive flex flex-row items-center gap-1">
                <XCircleIcon className="size-4 shrink-0 text-destructive" />
                <span className="max-w-2xl truncate">
                  Unknown tool "{toolName}" completed
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              <div className="text-sm text-foreground/80">
                <div className="whitespace-pre-wrap">
                  Unknown tool output:{" "}
                  {typeof part.output === "string"
                    ? part.output
                    : JSON.stringify(part.output, null, 2)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-2">
          <XCircleIcon className="size-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Unknown tool "{toolName}" error:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-2">
          <XCircleIcon className="size-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Unknown tool "{toolName}"
          </span>
        </div>
      );
  }
};

MessagePartToolCall.displayName = "MessagePartToolCall";
