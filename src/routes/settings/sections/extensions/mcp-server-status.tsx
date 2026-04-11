import { IconCircleCheck, IconCircleX, IconInfoCircle } from "@tabler/icons-react";

import { Spinner } from "@/components/ui/spinner";
import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import { cn } from "@/lib/utils";

interface McpServerStatusProps {
  state?: McpServerLoadState;
  disabled?: boolean;
  compact?: boolean;
}

function getStatusLabel(status: McpServerLoadState["status"] | undefined): string {
  switch (status) {
    case "disabled":
      return "Disabled";
    case "starting":
      return "Starting";
    case "connecting":
      return "Connecting";
    case "loaded":
      return "Loaded";
    case "error":
      return "Error";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function McpServerStatus({
  state,
  disabled = false,
  compact = false,
}: McpServerStatusProps) {
  const status = disabled ? "disabled" : (state?.status ?? "unknown");
  const label = getStatusLabel(status);

  if (compact) {
    if (status === "starting" || status === "connecting") {
      return <Spinner className="text-muted-foreground size-3" />;
    }

    return (
      <div
        className={cn(
          "size-2 rounded-full",
          status === "loaded" && "bg-green-500",
          status === "error" && "bg-red-500",
          (status === "unknown" || status === "disabled") && "bg-yellow-500",
        )}
      />
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        {status === "starting" || status === "connecting" ? (
          <Spinner className="text-foreground" data-icon="inline-start" />
        ) : status === "loaded" ? (
          <IconCircleCheck className="text-foreground size-5" />
        ) : status === "error" ? (
          <IconCircleX className="text-foreground size-5" />
        ) : (
          <IconInfoCircle className="text-foreground size-5" />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm">{label}</span>
          {status === "loaded" ? (
            <span className="text-muted-foreground text-xs">
              {state?.toolCount === 1
                ? "1 tool available"
                : `${state?.toolCount ?? 0} tools available`}
            </span>
          ) : state?.error ? (
            <span className="text-muted-foreground line-clamp-2 text-xs">{state.error}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
