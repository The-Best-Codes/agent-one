import NumberFlow from "@number-flow/react";
import { IconChevronLeft } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatLoading, useChatMessages } from "@/contexts/use-chat/chat-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { useMediaQuery } from "@/hooks/use-media-query";
import { calculateChatUsageFromMessages, getLastAssistantUsage } from "@/lib/ai/chat-usage";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { collapsedSidebarLayoutAtom } from "@/lib/jotai/settings-atoms";
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
  const messages = useChatMessages();
  const isChatLoading = useChatLoading();
  const { currentModel } = useModel();
  const [isSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [collapsedLayout] = useAtom(collapsedSidebarLayoutAtom);
  const [delayPassed, setDelayPassed] = useState(false);
  const currentUsage = useMemo(() => calculateChatUsageFromMessages(messages), [messages]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSidebarSmall = isSidebarCollapsed || !isDesktop;
  const isColumnLayout = collapsedLayout === "column";

  const isAgentOneModel = currentModel?.provider === "AgentOne";

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
  const lastUsage = getLastAssistantUsage(messages);

  const totalCostUsd = currentUsage.totalCostUsd;
  const hasUnknownCost = currentUsage.hasUnknownCost;
  const contextInputTokens = lastUsage.inputTokens;
  const contextOutputTokens = lastUsage.outputTokens;
  const totalTokens = contextInputTokens + contextOutputTokens;
  const maxTokens = currentModel?.contextWindow;
  const isExceeded = maxTokens !== undefined && totalTokens > maxTokens;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-40 -translate-x-2 transition-[margin] duration-200 md:top-2 md:left-2 md:translate-x-0",
        isSidebarSmall ? (isColumnLayout ? "ml-10" : "ml-24") : "ml-64",
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
                  <AdaptiveTooltip>
                    <AdaptiveTooltipTrigger
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
                    </AdaptiveTooltipTrigger>
                    <AdaptiveTooltipContent className="max-w-xs">
                      This chat is currently {totalTokens} tokens long.{" "}
                      {maxTokens !== undefined
                        ? `The model you're using supports up to ${maxTokens.toLocaleString()} tokens.`
                        : "The model you're using supports an unknown number of tokens."}
                    </AdaptiveTooltipContent>
                  </AdaptiveTooltip>

                  <AdaptiveTooltip>
                    <AdaptiveTooltipTrigger
                      className="focus-visible:border-ring focus-visible:ring-ring/50 cursor-help rounded outline-none focus-visible:ring-[3px]"
                      tabIndex={isCollapsed ? -1 : 0}
                      asChild
                    >
                      <span>
                        {hasUnknownCost && totalCostUsd <= 0 ? (
                          <span className="text-foreground tabular-nums">$?</span>
                        ) : (
                          <NumberFlow
                            value={totalCostUsd}
                            format={{
                              style: "currency",
                              currency: "USD",
                            }}
                            prefix={hasUnknownCost ? "≥ " : undefined}
                            className="text-foreground tabular-nums"
                          />
                        )}
                      </span>
                    </AdaptiveTooltipTrigger>
                    <AdaptiveTooltipContent className="max-w-xs">
                      {hasUnknownCost
                        ? totalCostUsd > 0
                          ? "Estimated cost is a lower bound, as pricing data is missing for one or more messages in this chat. Edits and deleted messages are not included in these stats."
                          : "Pricing data is unavailable for the model(s) used in this chat, so the cost cannot be estimated."
                        : "Estimated cost of this chat in USD. Edits and deleted messages are not included in these stats."}
                    </AdaptiveTooltipContent>
                  </AdaptiveTooltip>
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
