import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type McpServerConfig } from "@/lib/settings/types";

import { McpAuthStatus } from "./mcp-auth-status";

interface ExtensionAdvancedDetailsProps {
  server: McpServerConfig;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
}

export function ExtensionAdvancedDetails({
  server,
  onUpdate,
}: ExtensionAdvancedDetailsProps) {
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor={`name-${server.id}`} className="text-xs">
            Name
          </Label>
          <Input
            id={`name-${server.id}`}
            value={server.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            placeholder="Extension name"
          />
        </div>

        <div className="grid gap-1.5 sm:w-32">
          <Label htmlFor={`timeout-${server.id}`} className="text-xs">
            Timeout (sec)
          </Label>
          <Input
            id={`timeout-${server.id}`}
            type="number"
            min="1"
            max="300"
            value={Math.round(server.timeoutMs / 1000)}
            onChange={(event) =>
              onUpdate({
                timeoutMs: (parseInt(event.target.value) || 30) * 1000,
              })
            }
            placeholder="30"
          />
        </div>
      </div>

      {server.type === "stdio" ? (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor={`command-${server.id}`} className="text-xs">
              Command
            </Label>
            <Input
              id={`command-${server.id}`}
              value={server.command}
              onChange={(event) => onUpdate({ command: event.target.value })}
              placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
            />
          </div>
          <EnvVarsEditor
            id={server.id}
            env={server.env}
            onChange={(env) => onUpdate({ env })}
          />
        </>
      ) : (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor={`url-${server.id}`} className="text-xs">
              URL
            </Label>
            <Input
              id={`url-${server.id}`}
              value={server.url}
              onChange={(event) => onUpdate({ url: event.target.value })}
              placeholder="https://mcp.example.com/api"
            />
          </div>
          <McpAuthStatus server={server} disabled={!server.enabled} />
          <HttpHeadersEditor
            id={server.id}
            headers={server.headers}
            onChange={(headers) => onUpdate({ headers })}
          />
        </>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label htmlFor={`approval-${server.id}`} className="text-sm">
            Require Approval
          </Label>
          <span className="text-muted-foreground text-xs">
            Ask for confirmation before running tools
          </span>
        </div>
        <Switch
          id={`approval-${server.id}`}
          checked={server.requiresApproval ?? false}
          onCheckedChange={(checked) =>
            onUpdate({
              requiresApproval: checked,
            })
          }
        />
      </div>
    </div>
  );
}
