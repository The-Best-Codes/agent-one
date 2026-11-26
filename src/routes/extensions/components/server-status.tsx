import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { ServerStatusTone } from "../model";

export function ServerStatusDot({
  tone,
  className,
}: {
  tone: ServerStatusTone;
  className?: string;
}) {
  if (tone === "loading") {
    return (
      <span className={cn("flex size-2 shrink-0 items-center justify-center", className)}>
        <Spinner className="size-3" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        tone === "ok" && "bg-green-500",
        tone === "warn" && "bg-yellow-500",
        tone === "error" && "bg-red-500",
        tone === "off" && "bg-muted-foreground/50",
        className,
      )}
    />
  );
}
