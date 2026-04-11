import { useAtomValue } from "jotai";

import { mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

import { McpAuthStatus } from "./mcp-auth-status";
import { McpServerApprovalSettings } from "./mcp-server-approval-settings";
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
      <McpServerStatus
        state={loadState}
        disabled={!server.enabled}
        switchId={`enabled-${server.id}`}
        onEnabledChange={(checked) => onUpdate({ enabled: checked })}
      />

      <McpServerApprovalSettings
        idPrefix={server.id}
        enabled={server.enabled}
        requiresApproval={server.requiresApproval}
        toolApprovalOverrides={server.toolApprovalOverrides}
        loadState={loadState}
        approvalDescription="Ask for confirmation before running tools"
        onRequiresApprovalChange={(requiresApproval) => onUpdate({ requiresApproval })}
        onToolApprovalOverridesChange={(toolApprovalOverrides) =>
          onUpdate({ toolApprovalOverrides })
        }
      />

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
        }}
        showApprovalControls={false}
        httpSupplement={
          server.type === "http" ? (
            <McpAuthStatus server={server} disabled={!server.enabled} />
          ) : null
        }
      />
    </div>
  );
}
