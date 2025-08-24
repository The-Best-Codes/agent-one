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
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            Unknown tool "{toolName}"
          </span>
        </div>
      );

    case "input-available":
      return (
        <Accordion
          type="single"
          collapsible
          className="bg-secondary my-1 w-full rounded-md"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <XCircleIcon className="text-destructive size-4 shrink-0" />
                <span className="max-w-2xl truncate">
                  Unknown tool executing "{toolName}"
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              {part.input && typeof part.input === "object" ? (
                <div className="text-foreground/80 text-xs">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-transparent p-2 text-xs">
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
          className="bg-secondary my-1 w-full rounded-md"
        >
          <AccordionItem value={callId}>
            <AccordionTrigger className="p-2 hover:no-underline">
              <p className="text-destructive flex flex-row items-center gap-1 text-sm font-bold">
                <XCircleIcon className="text-destructive size-4 shrink-0" />
                <span className="max-w-2xl truncate">
                  Unknown tool "{toolName}" completed
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="p-2 pt-0">
              <div className="text-foreground/80 text-sm">
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
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
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
          <XCircleIcon className="text-destructive size-4 shrink-0" />
          <span className="text-destructive text-sm font-bold">
            Unknown tool "{toolName}"
          </span>
        </div>
      );
  }
};

MessagePartToolCall.displayName = "MessagePartToolCall";
