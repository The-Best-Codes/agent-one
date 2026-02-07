import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";
import { useId, useState } from "react";

import { NoMcpServers } from "@/components/a1/empty-states/no-mcp-servers";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

import { AddServerDialog } from "./add-server-dialog";
import { DeleteServerDialog } from "./delete-server-dialog";
import { ServerListItem } from "./server-list-item";

export default function McpSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit, setParallelLoadLimit] = useAtom(
    mcpParallelLoadLimitAtom,
  );

  const uniqueId = useId();

  const isParallelLoadLimitDefault =
    parallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  const handleResetParallelLoadLimit = () => {
    resetSetting("MCP_PARALLEL_LOAD_LIMIT");
  };

  const updateMcpServer = (
    index: number,
    updates: Partial<McpServerConfig>,
  ) => {
    setMcpServers((prev) =>
      prev.map((server, i) =>
        i === index ? ({ ...server, ...updates } as McpServerConfig) : server,
      ),
    );
  };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<number | null>(null);

  const handleDeleteClick = (index: number) => {
    setServerToDelete(index);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (serverToDelete !== null) {
      setMcpServers((prev) => prev.filter((_, i) => i !== serverToDelete));
    }
    setServerToDelete(null);
    setShowDeleteDialog(false);
  };

  const cancelDelete = () => {
    setServerToDelete(null);
    setShowDeleteDialog(false);
  };

  const handleAddServer = (serverData: {
    type: "stdio" | "http";
    name: string;
    command?: string;
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    timeoutSec: number;
    requiresApproval: boolean;
  }) => {
    const newServer: McpServerConfig =
      serverData.type === "stdio"
        ? {
            id: `server-${uniqueId}-${crypto.randomUUID()}`,
            type: "stdio",
            name: serverData.name,
            command: serverData.command!,
            env: serverData.env || {},
            enabled: true,
            timeoutMs: serverData.timeoutSec * 1000,
            requiresApproval: serverData.requiresApproval,
          }
        : {
            id: `server-${uniqueId}-${crypto.randomUUID()}`,
            type: "http",
            name: serverData.name,
            url: serverData.url!,
            headers: serverData.headers || {},
            enabled: true,
            timeoutMs: serverData.timeoutSec * 1000,
            requiresApproval: serverData.requiresApproval,
          };

    setMcpServers((prev) => [newServer, ...prev]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label
              htmlFor="parallel-load-limit"
              className="text-sm font-medium"
            >
              Parallel Load Limit
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum number of MCP servers to load concurrently.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="parallel-load-limit"
              type="number"
              min="1"
              max="20"
              value={parallelLoadLimit}
              onChange={(e) =>
                setParallelLoadLimit(parseInt(e.target.value) || 8)
              }
              className="w-20"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetParallelLoadLimit}
              disabled={isParallelLoadLimitDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Configured Servers</Label>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            Add Server
          </Button>
        </div>

        {mcpServers.length === 0 ? (
          <NoMcpServers />
        ) : (
          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {mcpServers.map((server, index) => (
              <ServerListItem
                key={server.id}
                server={server}
                index={index}
                onUpdate={updateMcpServer}
                onDelete={handleDeleteClick}
              />
            ))}
          </Accordion>
        )}
      </CardContent>

      <AddServerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddServer={handleAddServer}
      />

      <DeleteServerDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Card>
  );
}
