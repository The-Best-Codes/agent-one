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
    <div className="bg-background flex items-center gap-3 rounded-md border px-3 py-2">
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

      <div className="flex items-center gap-2">
        <span className="text-xs">Enabled</span>
        <Switch checked={enabled} onCheckedChange={onEnabledChange} aria-label="Toggle extension" />
      </div>
    </div>
  );
}
