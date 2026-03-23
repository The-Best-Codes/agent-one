import { IconRefresh, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatFunctions, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { getAiErrorMessageUx } from "@/lib/error/ai-error-messages";

export const MainInputErrorSection = ({ onRetry }: { onRetry?: () => void }) => {
  const { error } = useChatStatus();
  const { regenerate, clearError } = useChatFunctions();
  const { hasAvailableModels } = useModelCatalog();

  if (!error) {
    return null;
  }

  const { message: displayMessage, description: displayDescription } = getAiErrorMessageUx(
    error.message,
  );

  return (
    <div className="bg-destructive/20 border-destructive text-foreground mb-0 flex w-full flex-row items-center justify-between gap-2 rounded-none border p-2 md:mb-2 md:rounded-md">
      <div className="flex max-h-24 w-full flex-col items-start overflow-auto">
        {displayMessage && <h3 className="text-lg font-bold">{displayMessage}</h3>}
        {displayDescription && <span className="text-base">{displayDescription}</span>}
      </div>
      <div className="flex flex-row items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                void regenerate();
                onRetry?.();
              }}
              variant="destructive"
              disabled={!hasAvailableModels}
            >
              <IconRefresh data-icon="inline-start" />
              Retry
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-h-48 max-w-48">
            Discards the last AI message (if any) and retries
          </TooltipContent>
        </Tooltip>
        <Button title="Ignore error" size="icon" onClick={() => clearError()} variant="outline">
          <IconX />
        </Button>
      </div>
    </div>
  );
};
