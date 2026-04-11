import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import { cn } from "@/lib/utils";

interface McpServerStatusProps {
  state?: McpServerLoadState;
  disabled?: boolean;
  compact?: boolean;
  switchId?: string;
  onEnabledChange?: (enabled: boolean) => void;
}

function getStatusLabel(status: McpServerLoadState["status"] | undefined): string {
  switch (status) {
    case "disabled":
      return "Disabled";
    case "loaded":
    case "starting":
    case "connecting":
    case "unknown":
      return "Enabled";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

function getStatusDescription(state?: McpServerLoadState, disabled?: boolean): string {
  if (disabled) {
    return "Toggle the switch to enable this server";
  }

  switch (state?.status) {
    case "loaded":
      return state.toolCount === 1 ? "1 tool available" : `${state.toolCount} tools available`;
    case "starting":
      return "Starting server";
    case "connecting":
      return "Connecting to server";
    case "error":
      return state.error ?? "Unable to load tools";
    case "unknown":
    default:
      return "Waiting for server to load";
  }
}

export function McpServerStatus({
  state,
  disabled = false,
  compact = false,
  switchId,
  onEnabledChange,
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm">{label}</span>
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {getStatusDescription(state, disabled)}
          </span>
        </div>
      </div>
      {onEnabledChange ? (
        <Switch
          id={switchId}
          checked={!disabled}
          onCheckedChange={onEnabledChange}
          aria-label="Toggle extension"
        />
      ) : null}
    </div>
  );
}
