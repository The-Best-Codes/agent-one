import type { ToolUIPart } from "ai";
import {
  AlertTriangleIcon,
  Loader2Icon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import accordion components

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
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={callId}>
            <AccordionTrigger className="flex items-center gap-2 py-2">
              <Loader2Icon className="h-4 w-4 shrink-0 animate-spin text-foreground" />
              <span className="text-sm font-bold text-foreground">
                Executing "{toolName}"
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-2">
              {part.input &&
              typeof part.input === "object" &&
              Object.keys(part.input).length > 0 ? (
                <div className="text-xs text-foreground/80">
                  <span className="font-medium">Parameters:</span>
                  <pre className="mt-1 bg-transparent p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(part.input as any, null, 2)}
                  </pre>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

    case "output-available":
      return (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={callId}>
            <AccordionTrigger className="flex items-center gap-2 py-2">
              <WrenchIcon className="h-4 w-4 shrink-0 text-foreground" />
              <span className="text-sm font-bold text-foreground">
                Tool "{toolName}" completed
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-2">
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
              {(part as any).errorText}
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
