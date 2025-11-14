import { useAtom } from "jotai";
import { RotateCcwIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  enabledToolsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type McpServerConfig,
  type ToolId,
} from "@/lib/settings/types";

const TOOL_NAMES: Record<ToolId, string> = {
  dateTime: "Date & Time",
  waitNumberMilliseconds: "Wait Milliseconds",
  getUrlContent: "Get URL Content",
  webSearch: "Web Search",
};

export default function ToolsSection() {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit, setParallelLoadLimit] = useAtom(
    mcpParallelLoadLimitAtom,
  );

  const isEnabledToolsDefault =
    JSON.stringify(enabledTools) ===
    JSON.stringify(DEFAULT_SETTINGS.ENABLED_TOOLS);
  const isParallelLoadLimitDefault =
    parallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  const handleResetEnabledTools = () => {
    resetSetting("ENABLED_TOOLS");
  };

  const handleResetParallelLoadLimit = () => {
    resetSetting("MCP_PARALLEL_LOAD_LIMIT");
  };

  const updateToolEnabled = (toolId: ToolId, enabled: boolean) => {
    setEnabledTools((prev) => ({ ...prev, [toolId]: enabled }));
  };

  const updateMcpServer = (
    index: number,
    updates: Partial<McpServerConfig>,
  ) => {
    setMcpServers((prev) =>
      prev.map((server, i) =>
        i === index ? { ...server, ...updates } : server,
      ),
    );
  };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<number | null>(null);
  const [newServerName, setNewServerName] = useState("");
  const [newServerCommand, setNewServerCommand] = useState("");
  const [newServerTimeout, setNewServerTimeout] = useState(30000);

  const isAddFormValid =
    newServerName.trim() !== "" && newServerCommand.trim() !== "";

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    const newServer: McpServerConfig = {
      id: `server-${Date.now()}`,
      name: newServerName.trim(),
      command: newServerCommand.trim(),
      enabled: true,
      timeoutMs: newServerTimeout,
    };
    setMcpServers((prev) => [newServer, ...prev]);

    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeout(30000);
    setShowAddDialog(false);
  };

  const handleCancelAdd = () => {
    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeout(30000);
    setShowAddDialog(false);
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Static Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Enabled Tools</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose which built-in tools are available to the AI.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetEnabledTools}
              disabled={isEnabledToolsDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {(Object.keys(TOOL_NAMES) as ToolId[]).map((toolId) => (
              <div key={toolId} className="flex items-center space-x-2">
                <Checkbox
                  id={toolId}
                  checked={enabledTools[toolId]}
                  onCheckedChange={(checked) =>
                    updateToolEnabled(toolId, checked as boolean)
                  }
                />
                <Label htmlFor={toolId} className="text-sm">
                  {TOOL_NAMES[toolId]}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MCP Servers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Parallel Load Limit</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Maximum number of MCP servers to load concurrently.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
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
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              No MCP servers configured. Click &quot;Add Server&quot; to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {mcpServers.map((server, index) => (
                <Card key={server.id} className="border py-0">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <Input
                          value={server.name}
                          onChange={(e) =>
                            updateMcpServer(index, { name: e.target.value })
                          }
                          placeholder="Server name"
                          className="font-medium"
                        />
                      </div>

                      <div className="flex-1">
                        <Input
                          value={server.command}
                          onChange={(e) =>
                            updateMcpServer(index, { command: e.target.value })
                          }
                          placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                        />
                      </div>

                      <div className="w-full sm:w-24">
                        <Input
                          type="number"
                          min="1000"
                          max="300000"
                          value={server.timeoutMs}
                          onChange={(e) =>
                            updateMcpServer(index, {
                              timeoutMs: parseInt(e.target.value) || 30000,
                            })
                          }
                          placeholder="Timeout (ms)"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id={`enabled-${server.id}`}
                        checked={server.enabled}
                        onCheckedChange={(checked) =>
                          updateMcpServer(index, { enabled: checked })
                        }
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteClick(index)}
                        aria-label="Remove server"
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new MCP server to extend the AI's capabilities.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="server-name">Name</Label>
              <Input
                id="server-name"
                placeholder="e.g., Everything Server"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server-command">Command</Label>
              <Input
                id="server-command"
                placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                value={newServerCommand}
                onChange={(e) => setNewServerCommand(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server-timeout">Timeout (ms)</Label>
              <Input
                id="server-timeout"
                type="number"
                min="1000"
                max="300000"
                value={newServerTimeout}
                onChange={(e) =>
                  setNewServerTimeout(parseInt(e.target.value) || 30000)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAdd}>
              Cancel
            </Button>
            <Button onClick={handleAddServer} disabled={!isAddFormValid}>
              Add Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete MCP Server</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this server? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
