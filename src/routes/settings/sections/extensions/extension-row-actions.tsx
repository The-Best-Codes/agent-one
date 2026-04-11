import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";

import { McpServerStatus } from "./mcp-server-status";
import { getMcpServerStatusTooltip } from "./mcp-server-status-utils";

interface ExtensionRowActionsProps {
  enabled: boolean;
  loadState?: McpServerLoadState;
  onEnabledChange: (enabled: boolean) => void;
}

export function ExtensionRowActions({
  enabled,
  loadState,
  onEnabledChange,
}: ExtensionRowActionsProps) {
  const toolCount = loadState?.status === "loaded" ? loadState.toolCount : null;

  return (
    <div className="bg-muted dark:bg-input/30 border-border flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            <McpServerStatus state={loadState} disabled={!enabled} compact />
          </div>
        </TooltipTrigger>
        <TooltipContent>{getMcpServerStatusTooltip(loadState, !enabled)}</TooltipContent>
      </Tooltip>
      {toolCount !== null ? (
        <span className="text-muted-foreground text-xs">
          {toolCount === 1 ? "1 tool" : `${toolCount} tools`}
        </span>
      ) : null}

      <Switch
        size="sm"
        className="ml-1"
        checked={enabled}
        onCheckedChange={onEnabledChange}
        aria-label="Toggle extension"
      />
    </div>
  );
}
