import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { type McpAuthState, type McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import { cn } from "@/lib/utils";

interface McpServerStatusProps {
  state?: McpServerLoadState;
  authState?: McpAuthState;
  disabled?: boolean;
  compact?: boolean;
  switchId?: string;
  onEnabledChange?: (enabled: boolean) => void;
}

function hasAuthIssue(
  status: McpServerLoadState["status"] | undefined,
  authState?: McpAuthState,
): boolean {
  return status === "error" && (authState === "logged-out" || authState === "supports-oauth");
}

function getStatusLabel(
  status: McpServerLoadState["status"] | undefined,
  authState?: McpAuthState,
): string {
  if (hasAuthIssue(status, authState)) {
    return "Auth";
  }

  switch (status) {
    case "disabled":
      return "Off";
    case "loaded":
      return "Enabled";
    case "starting":
      return "Loading...";
    case "connecting":
      return "Loading...";
    case "unknown":
      return "Loading...";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

function getStatusDescription(
  state?: McpServerLoadState,
  disabled?: boolean,
  authState?: McpAuthState,
): string {
  if (disabled) {
    return "Toggle the switch to enable this server";
  }

  if (hasAuthIssue(state?.status, authState)) {
    return authState === "supports-oauth"
      ? "Log in for full access to this server"
      : "Authentication required to load tools";
  }

  switch (state?.status) {
    case "loaded":
      if (state.toolCount === 0) {
        return "Connected, but no tools are available";
      }
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
  authState,
  disabled = false,
  compact = false,
  switchId,
  onEnabledChange,
}: McpServerStatusProps) {
  const status = disabled ? "disabled" : (state?.status ?? "unknown");
  const label = getStatusLabel(status, authState);
  const authIssue = hasAuthIssue(status, authState);

  if (compact) {
    const isLoading = label === "Loading...";

    if (isLoading) {
      return (
        <div className="flex items-center gap-1.5">
          <Spinner className="text-muted-foreground size-3" />
          <span className="text-muted-foreground text-xs">Loading...</span>
        </div>
      );
    }

    const compactLabel = status === "loaded" ? null : label;

    return (
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "size-2 rounded-full",
            status === "loaded" && "bg-green-500",
            status === "error" && !authIssue && "bg-red-500",
            (status === "unknown" || status === "disabled" || authIssue) && "bg-yellow-500",
          )}
        />
        {compactLabel ? (
          <span className="text-muted-foreground text-xs">{compactLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm">{label}</span>
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {getStatusDescription(state, disabled, authState)}
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
