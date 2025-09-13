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
    <div className="bg-destructive text-primary-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none p-2 md:mb-2 md:rounded-md">
      <span className="max-h-10 max-w-full overflow-auto">
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
            <TooltipContent className="max-h-48 max-w-48">
              Discards the last AI message (if any) and retries
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
