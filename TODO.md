- Support multi-threading of chats?
- Fix tool call re-rendering issues (all tool calls rerender when just one updates)
- Allow resuming after error without discarding previous message parts. One method, a bit clumsy:

```
import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
  useChatMessages,
} from "@/contexts/use-chat/chat-hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcwIcon, PlayIcon } from "lucide-react";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate, sendMessage } = useChatFunctions();
  const { messages } = useChatMessages();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  // Check if the last message is from assistant and has content
  const lastMessage = messages[messages.length - 1];
  const canResume = lastMessage && lastMessage.role === "assistant" && lastMessage.parts.length > 0;

  const handleResume = () => {
    // Send an empty message to continue the conversation from where it left off
    // This will trigger the AI to continue without discarding the previous content
    sendMessage({ text: "Please continue from where you left off." });
  };

  return (
    <div className="w-full flex flex-row items-center justify-between bg-destructive text-primary-foreground rounded-none md:rounded-md p-2 mb-0 md:mb-2 gap-2">
      <span className="max-w-full max-h-10 overflow-auto">
        {errorText || "An unknown error occurred"}
      </span>
      <div className="flex flex-row items-center gap-2">
        <TooltipProvider>
          {canResume && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button onClick={handleResume} variant="secondary">
                  <PlayIcon />
                  Resume
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Continue from where the AI left off without discarding previous content
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button onClick={() => regenerate()} variant="secondary">
                <RefreshCcwIcon />
                Retry
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Discards the last AI message (if any) and retries
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
```
