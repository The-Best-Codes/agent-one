import type { ToolUIPart } from "ai";
import { AlertCircle, Loader2 } from "lucide-react";

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
          <Loader2 className="h-4 w-4 animate-spin text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Preparing {toolName} request...
          </span>
        </div>
      );

    case "input-available":
      return (
        <div key={callId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">
              Executing {toolName}
            </span>
          </div>
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
        </div>
      );

    case "output-available":
      return (
        <div key={callId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-foreground" />
            <span className="text-sm font-bold text-foreground">
              {toolName} completed
            </span>
          </div>
          <div className="text-sm text-foreground/80">
            {typeof part.output === "string" ? (
              <div className="whitespace-pre-wrap">{part.output as string}</div>
            ) : (
              <pre className="bg-transparent p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            )}
          </div>
        </div>
      );

    case "output-error":
      return (
        <div key={callId} className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
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
          <Loader2 className="h-4 w-4 text-foreground" />
          <span className="text-sm font-bold text-foreground">
            Unknown tool call state for {toolName}
          </span>
        </div>
      );
  }
};
