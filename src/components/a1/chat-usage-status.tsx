import { useChatMetadata } from "@/contexts/use-chat/chat-hooks";

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

  return (
    <div className="pointer-events-none fixed top-2 right-2 z-40">
      <div className="bg-background/90 border-border/70 text-muted-foreground flex items-center gap-2 rounded-md border px-2 py-1 text-xs backdrop-blur">
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
