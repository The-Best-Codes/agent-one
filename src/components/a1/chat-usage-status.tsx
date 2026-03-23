import NumberFlow from "@number-flow/react";
import { IconChevronLeft } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useChatLoading,
  useChatMessages,
  useChatMetadata,
  useChatStatus,
} from "@/contexts/use-chat/chat-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { useMediaQuery } from "@/hooks/use-media-query";
import { calculateChatUsageFromMessages, getLastAssistantTokens } from "@/lib/ai/chat-usage";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { sidebarCollapsedAtom } from "@/lib/jotai/unsynced-local-atoms";
import { cn } from "@/lib/utils";

const CircularProgress = ({
  value,
  max,
  className,
  progressClassName,
}: {
  value: number;
  max?: number;
  className?: string;
  progressClassName?: string;
}) => {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const ratio = max ? Math.min(value / max, 1) : 1;
  const offset = circumference - ratio * circumference;

  return (
    <div className={cn("relative size-5 flex items-center justify-center", className)}>
      <svg className="absolute inset-0" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          className={cn("text-foreground transition-all duration-200", progressClassName)}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "12px 12px",
          }}
        />
      </svg>
    </div>
  );
};

export const ChatUsageStatus = () => {
  const metadata = useChatMetadata();
  const messages = useChatMessages();
  const { status } = useChatStatus();
  const isChatLoading = useChatLoading();
  const { currentModel } = useModel();
  const [isSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [delayPassed, setDelayPassed] = useState(false);
  const [staleMetadata, setStaleMetadata] = useState(metadata);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSidebarSmall = isSidebarCollapsed || !isDesktop;

  const isAgentOneModel = currentModel?.provider === "AgentOne";

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

  if (isAgentOneModel) {
    return null;
  }

  const showSkeleton = isChatLoading && delayPassed;
  const displayedMetadata = isChatLoading ? staleMetadata : metadata;

  const isStreaming = status === "streaming" || status === "submitted";
  const liveUsage = isStreaming ? calculateChatUsageFromMessages(messages) : undefined;

  const totalCostUsd = liveUsage?.totalCostUsd ?? Number(displayedMetadata.totalCostUsd);

  const lastTokens = isStreaming ? getLastAssistantTokens(messages) : undefined;
  const contextInputTokens = Number(lastTokens?.inputTokens ?? displayedMetadata.inputTokens ?? 0);
  const contextOutputTokens = Number(
    lastTokens?.outputTokens ?? displayedMetadata.outputTokens ?? 0,
  );
  const totalTokens = contextInputTokens + contextOutputTokens;
  const maxTokens = currentModel?.contextWindow;
  const isExceeded = maxTokens !== undefined && totalTokens > maxTokens;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-40 -translate-x-2 transition-[margin] duration-200 md:top-2 md:left-2 md:translate-x-0",
        isSidebarSmall ? "ml-24" : "ml-64",
      )}
    >
      <div className="bg-background border-sidebar-border text-muted-foreground flex items-center rounded-br-md border-r border-b text-xs whitespace-nowrap md:rounded-md md:border">
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isCollapsed ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100",
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 px-2 py-1.5">
              {showSkeleton ? (
                <>
                  <Skeleton className="size-5 rounded-full" />
                  <Skeleton className="h-5 w-12" />
                </>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger
                      className="focus-visible:border-ring focus-visible:ring-ring/50 cursor-help rounded outline-none focus-visible:ring-[3px]"
                      tabIndex={isCollapsed ? -1 : 0}
                      asChild
                    >
                      <div>
                        <CircularProgress
                          value={totalTokens}
                          max={maxTokens}
                          progressClassName={
                            isExceeded
                              ? "text-destructive"
                              : maxTokens === undefined
                                ? "text-yellow-500"
                                : undefined
                          }
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      This chat is currently {totalTokens} tokens long.{" "}
                      {maxTokens !== undefined
                        ? `The model you're using supports up to ${maxTokens.toLocaleString()} tokens.`
                        : "The model you're using supports an unknown number of tokens."}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger
                      className="focus-visible:border-ring focus-visible:ring-ring/50 cursor-help rounded outline-none focus-visible:ring-[3px]"
                      tabIndex={isCollapsed ? -1 : 0}
                      asChild
                    >
                      <span>
                        <NumberFlow
                          value={totalCostUsd}
                          format={{
                            style: "currency",
                            currency: "USD",
                          }}
                          className="text-foreground"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Estimated cost of this chat in USD. Edits and deleted messages are not
                      included in these stats.
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "Expand usage stats" : "Collapse usage stats"}
          data-is-collapsed={isCollapsed}
          className="hover:text-accent-foreground hover:bg-accent dark:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-br-md px-0.5 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none md:rounded-r-md md:data-[is-collapsed=true]:rounded-md"
        >
          <IconChevronLeft
            className={cn(
              "size-3.5 transition-transform duration-300 ease-in-out",
              isCollapsed && "rotate-180",
            )}
          />
        </button>
      </div>
    </div>
  );
};
