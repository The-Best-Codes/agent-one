import { useAtomValue } from "jotai";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

import { McpAuthStatus } from "./mcp-auth-status";
import { McpServerConfigForm } from "./mcp-server-config-form";
import { McpServerStatus } from "./mcp-server-status";

interface ExtensionAdvancedDetailsProps {
  server: McpServerConfig;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
}

export function ExtensionAdvancedDetails({ server, onUpdate }: ExtensionAdvancedDetailsProps) {
  const loadStates = useAtomValue(mcpServerLoadStatesAtom);
  const loadState = loadStates[server.id];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label htmlFor={`enabled-${server.id}`} className="text-sm">
            Enabled
          </Label>
          <span className="text-muted-foreground text-xs">
            Load this extension when tools initialize
          </span>
        </div>
        <Switch
          id={`enabled-${server.id}`}
          checked={server.enabled}
          onCheckedChange={(checked) => onUpdate({ enabled: checked })}
        />
      </div>

      <McpServerStatus state={loadState} disabled={!server.enabled} />

      <McpServerConfigForm
        idPrefix={server.id}
        values={{
          type: server.type,
          name: server.name,
          command: server.type === "stdio" ? server.command : "",
          env: server.type === "stdio" ? server.env : {},
          url: server.type === "http" ? server.url : "",
          headers: server.type === "http" ? server.headers : {},
          timeoutSec: server.timeoutMs / 1000,
          requiresApproval: server.requiresApproval,
          toolApprovalOverrides: server.toolApprovalOverrides,
        }}
        onChange={(updates) => {
          if (updates.name !== undefined) {
            onUpdate({ name: updates.name });
          }
          if (updates.command !== undefined && server.type === "stdio") {
            onUpdate({ command: updates.command });
          }
          if (updates.env !== undefined && server.type === "stdio") {
            onUpdate({ env: updates.env });
          }
          if (updates.url !== undefined && server.type === "http") {
            onUpdate({ url: updates.url });
          }
          if (updates.headers !== undefined && server.type === "http") {
            onUpdate({ headers: updates.headers });
          }
          if (updates.timeoutSec !== undefined) {
            onUpdate({ timeoutMs: updates.timeoutSec * 1000 });
          }
          if (updates.requiresApproval !== undefined) {
            onUpdate({ requiresApproval: updates.requiresApproval });
          }
          if (updates.toolApprovalOverrides !== undefined) {
            onUpdate({ toolApprovalOverrides: updates.toolApprovalOverrides });
          }
        }}
        approvalDescription="Ask for confirmation before running tools"
        availableTools={loadState?.toolNames ?? []}
        httpSupplement={
          server.type === "http" ? (
            <McpAuthStatus server={server} disabled={!server.enabled} />
          ) : null
        }
      />
    </div>
  );
}
