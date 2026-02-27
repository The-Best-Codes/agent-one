import { useAtom } from "jotai";

import { useChatMetadata } from "@/contexts/use-chat/chat-hooks";
import { useMediaQuery } from "@/hooks/use-media-query";
import { sidebarCollapsedAtom } from "@/lib/jotai/unsynced-local-atoms";
import { cn } from "@/lib/utils";

function formatTokenCount(value: number | undefined): string {
  return Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatCostUsd(value: number | undefined): string {
  const amount = value ?? 0;
  if (amount >= 1) {
    return `$${amount.toFixed(2)}`;
  }
  if (amount >= 0.01) {
    return `$${amount.toFixed(3)}`;
  }
  return `$${amount.toFixed(4)}`;
}

export const ChatUsageStatus = () => {
  const metadata = useChatMetadata();
  const [isSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSidebarSmall = isSidebarCollapsed || !isDesktop;

  return (
    <div
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-40 transition-[margin] duration-200 md:top-2 md:left-2",
        isSidebarSmall ? "ml-22 md:ml-24" : "ml-64",
      )}
    >
      <div className="bg-background border-sidebar-border text-muted-foreground flex items-center gap-2 rounded-br-md border-r border-b px-2 py-1 text-xs md:rounded-md md:border">
        <span>
          In{" "}
          <span className="text-foreground">
            {formatTokenCount(metadata.inputTokens)}
          </span>
        </span>
        <span>
          Out{" "}
          <span className="text-foreground">
            {formatTokenCount(metadata.outputTokens)}
          </span>
        </span>
        <span>
          Cost{" "}
          <span className="text-foreground">
            {formatCostUsd(metadata.totalCostUsd)}
          </span>
        </span>
      </div>
    </div>
  );
};
