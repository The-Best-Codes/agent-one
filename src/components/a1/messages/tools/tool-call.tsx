import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolUIPart } from "ai";
import {
  AlertTriangleIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";

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
          <Loader2Icon className="h-4 w-4 shrink-0 animate-spin text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Preparing "{toolName}" request...
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
              <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
                <Loader2Icon className="h-4 w-4 animate-spin shrink-0 text-foreground" />
                <span className="max-w-2xl truncate">
                  Executing "{toolName}"
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              {part.input &&
              typeof part.input === "object" &&
              Object.keys(part.input).length > 0 ? (
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
              <p className="text-sm font-bold text-foreground flex flex-row items-center gap-1">
                <WrenchIcon className="h-4 w-4 shrink-0 text-foreground" />
                <span className="max-w-2xl truncate">
                  Tool "{toolName}" completed
                </span>
              </p>
            </AccordionTrigger>
            <AccordionContent className="pt-0 p-2">
              <div className="text-sm text-foreground/80">
                {typeof part.output === "string" ? (
                  <div className="whitespace-pre-wrap">
                    {part.output as string}
                  </div>
                ) : (
                  <pre className="bg-transparent p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(part.output, null, 2)}
                  </pre>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-2">
          <XCircleIcon className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm font-bold text-destructive">
            Error executing {toolName}:{" "}
            <span className="text-destructive/80 font-normal">
              {part?.errorText || "Unknown error"}
            </span>
          </span>
        </div>
      );

    default:
      return (
        <div key={callId} className="flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 shrink-0 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown tool call state for {toolName}
          </span>
        </div>
      );
  }
};
