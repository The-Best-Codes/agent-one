import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import i18n from "@/lib/i18n";
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
    return i18n.t("extensions.statusAuth");
  }

  switch (status) {
    case "disabled":
      return i18n.t("common.off");
    case "loaded":
      return i18n.t("common.enabled");
    case "starting":
      return i18n.t("common.loadingEllipsis");
    case "connecting":
      return i18n.t("common.loadingEllipsis");
    case "unknown":
      return i18n.t("common.loadingEllipsis");
    case "error":
      return i18n.t("common.error");
    default:
      return i18n.t("common.unknown");
  }
}

function getStatusDescription(
  state?: McpServerLoadState,
  disabled?: boolean,
  authState?: McpAuthState,
): string {
  if (disabled) {
    return i18n.t("extensions.toggleToEnable");
  }

  if (hasAuthIssue(state?.status, authState)) {
    return authState === "supports-oauth"
      ? i18n.t("extensions.connectForAccess")
      : i18n.t("extensions.authRequired");
  }

  switch (state?.status) {
    case "loaded":
      if (state.toolCount === 0) {
        return i18n.t("extensions.connectedNoTools");
      }
      return state.toolCount === 1
        ? i18n.t("extensions.loadedOneTool")
        : i18n.t("extensions.loadedTools", { count: state.toolCount });
    case "starting":
      return i18n.t("extensions.startingServer");
    case "connecting":
      return i18n.t("extensions.connectingToServer");
    case "error":
      return state.error ?? i18n.t("extensions.unableToLoadTools");
    case "unknown":
    default:
      return i18n.t("extensions.waitingToLoad");
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
    const isLoading = label === i18n.t("common.loadingEllipsis");

    if (isLoading) {
      return (
        <div className="flex items-center gap-1.5">
          <Spinner className="text-muted-foreground size-3" />
          <span className="text-muted-foreground text-xs">{i18n.t("common.loadingEllipsis")}</span>
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
          aria-label={i18n.t("extensions.toggleExtension")}
        />
      ) : null}
    </div>
  );
}
