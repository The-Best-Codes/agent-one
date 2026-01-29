import { Trash2Icon } from "lucide-react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type McpHttpServerConfig,
  type McpServerConfig,
} from "@/lib/settings/types";

import { McpAuthStatus } from "./mcp-auth-status";

interface ServerListItemProps {
  server: McpServerConfig;
  index: number;
  onUpdate: (index: number, updates: Partial<McpServerConfig>) => void;
  onDelete: (index: number) => void;
}

export function ServerListItem({
  server,
  index,
  onUpdate,
  onDelete,
}: ServerListItemProps) {
  const getServerTypeLabel = (server: McpServerConfig) => {
    return server.type === "stdio" ? "STDIO" : "HTTP";
  };

  return (
    <AccordionItem key={server.id} value={server.id}>
      <div className="flex items-center gap-2 px-3 *:first:flex-1">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-2">
            <span>{server.name || "Unnamed Server"}</span>
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
              {getServerTypeLabel(server)}
            </span>
          </div>
        </AccordionTrigger>
        <Switch
          id={`enabled-${server.id}`}
          checked={server.enabled}
          onCheckedChange={(checked) => onUpdate(index, { enabled: checked })}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Enable ${server.name || "server"}`}
        />
      </div>
      <AccordionContent className="px-3 pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor={`name-${server.id}`} className="text-xs">
                Name
              </Label>
              <Input
                id={`name-${server.id}`}
                value={server.name}
                onChange={(e) => onUpdate(index, { name: e.target.value })}
                placeholder="Server name"
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
                onChange={(e) =>
                  onUpdate(index, {
                    timeoutMs: (parseInt(e.target.value) || 30) * 1000,
                  })
                }
                placeholder="30"
              />
            </div>
          </div>

          {server.type === "stdio" ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`command-${server.id}`} className="text-xs">
                Command
              </Label>
              <Input
                id={`command-${server.id}`}
                value={server.command}
                onChange={(e) => onUpdate(index, { command: e.target.value })}
                placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor={`url-${server.id}`} className="text-xs">
                  URL
                </Label>
                <Input
                  id={`url-${server.id}`}
                  value={server.url}
                  onChange={(e) => onUpdate(index, { url: e.target.value })}
                  placeholder="https://mcp.example.com/api"
                />
              </div>
              <McpAuthStatus
                server={server as McpHttpServerConfig}
                disabled={!server.enabled}
              />
              <HttpHeadersEditor
                id={server.id}
                headers={server.headers}
                onChange={(headers) => onUpdate(index, { headers })}
              />
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor={`approval-${server.id}`} className="text-sm">
                Require Approval
              </Label>
              <span className="text-muted-foreground text-xs">
                Ask for confirmation before running tools from this server
              </span>
            </div>
            <Switch
              id={`approval-${server.id}`}
              checked={server.requiresApproval ?? false}
              onCheckedChange={(checked) =>
                onUpdate(index, {
                  requiresApproval: checked,
                })
              }
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(index)}
            className="w-fit"
          >
            <Trash2Icon className="size-4" />
            Delete Server
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
