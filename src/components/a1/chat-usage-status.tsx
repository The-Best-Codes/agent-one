import NumberFlow from "@number-flow/react";
import { useAtom } from "jotai";

import { useChatMetadata } from "@/contexts/use-chat/chat-hooks";
import { useMediaQuery } from "@/hooks/use-media-query";
import { sidebarCollapsedAtom } from "@/lib/jotai/unsynced-local-atoms";
import { cn } from "@/lib/utils";

export const ChatUsageStatus = () => {
  const metadata = useChatMetadata();
  const [isSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isSidebarSmall = isSidebarCollapsed || !isDesktop;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-40 -translate-x-2 transition-[margin] duration-200 md:top-2 md:left-2 md:translate-x-0",
        isSidebarSmall ? "ml-24" : "ml-64",
      )}
    >
      <div className="bg-background border-sidebar-border text-muted-foreground flex items-center gap-2 rounded-br-md border-r border-b px-2 py-1.5 text-xs md:rounded-md md:border">
        <span>
          In{" "}
          <NumberFlow
            value={Number(metadata.inputTokens)}
            className="text-foreground"
          />
        </span>
        <span>
          Out{" "}
          <NumberFlow
            value={Number(metadata.outputTokens)}
            className="text-foreground"
          />
        </span>
        <span>
          Cost{" "}
          <NumberFlow
            value={Number(metadata.totalCostUsd)}
            format={{
              style: "currency",
              currency: "USD",
            }}
            className="text-foreground"
          />
        </span>
      </div>
    </div>
  );
};
