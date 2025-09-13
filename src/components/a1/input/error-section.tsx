import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useChatFunctions,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";

export const MainInputErrorSection = () => {
  const { error } = useChatStatus();
  const { regenerate } = useChatFunctions();

  const errorText = error ? error.message : "";

  if (!error) {
    return null;
  }

  return (
    <div className="bg-destructive/20 border-destructive text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border-1 p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        <h3 className="text-lg font-bold">An error occurred:</h3>
        <span>{errorText || "Unknown error"}</span>
      </div>
      <div className="flex flex-row items-center gap-2">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button onClick={() => regenerate()} variant="destructive">
                <RefreshCcwIcon />
                Retry
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-h-48 max-w-48">
              Discards the last AI message (if any) and retries
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
