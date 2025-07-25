import { Button } from "@/components/ui/button";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcwIcon } from "lucide-react";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate } = useChatFunctions();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  return (
    <div className="w-full flex flex-row items-center justify-between bg-destructive text-primary-foreground rounded-none md:rounded-md p-2 mb-0 md:mb-2 gap-2">
      <span className="max-w-full max-h-10 overflow-auto">
        {errorText || "An unknown error occurred"}
      </span>
      <div className="flex flex-row items-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button onClick={() => regenerate()} variant="secondary">
                <RefreshCcwIcon />
                Retry
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-48 max-h-48 overflow-auto"
            >
              Discards the last AI message (if any) and retries
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
