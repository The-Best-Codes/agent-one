import NumberFlow from "@number-flow/react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatLoading, useChatMetadata } from "@/contexts/use-chat/chat-hooks";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { sidebarCollapsedAtom } from "@/lib/jotai/unsynced-local-atoms";
import { cn } from "@/lib/utils";

export const ChatUsageStatus = () => {
  const metadata = useChatMetadata();
  const isChatLoading = useChatLoading();
  const [isSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [delayPassed, setDelayPassed] = useState(false);
  const [staleMetadata, setStaleMetadata] = useState(metadata);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSidebarSmall = isSidebarCollapsed || !isDesktop;

  if (!isChatLoading && staleMetadata !== metadata) {
    setStaleMetadata(metadata);
  }

  useEffect(() => {
    if (!isChatLoading) {
      return;
    }

    const timer = setTimeout(() => {
      setDelayPassed(true);
    }, CHAT_LOADING_DELAY_MS);

    return () => {
      clearTimeout(timer);
      setDelayPassed(false);
    };
  }, [isChatLoading]);

  const showSkeleton = isChatLoading && delayPassed;
  const displayedMetadata = isChatLoading ? staleMetadata : metadata;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-40 -translate-x-2 transition-[margin] duration-200 md:top-2 md:left-2 md:translate-x-0",
        isSidebarSmall ? "ml-24" : "ml-64",
      )}
    >
      <div className="bg-background border-sidebar-border text-muted-foreground flex items-center gap-2 rounded-br-md border-r border-b px-2 py-1.5 text-xs md:rounded-md md:border">
        {showSkeleton ? (
          <>
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-8" />
          </>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<div className="flex cursor-help items-center gap-2" />}>
                <>
                  <span>
                    In{" "}
                    <NumberFlow
                      value={Number(displayedMetadata.inputTokens)}
                      className="text-foreground"
                    />
                  </span>
                  <span>
                    Out{" "}
                    <NumberFlow
                      value={Number(displayedMetadata.outputTokens)}
                      className="text-foreground"
                    />
                  </span>
                  <span>
                    Cost{" "}
                    <NumberFlow
                      value={Number(displayedMetadata.totalCostUsd)}
                      format={{
                        style: "currency",
                        currency: "USD",
                      }}
                      className="text-foreground"
                    />
                  </span>
                </>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Input tokens are what you send; output tokens are what the model returns. Cost is
                shown in USD. Edits and deleted messages are not included in these stats.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};
