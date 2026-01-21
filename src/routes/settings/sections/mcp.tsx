import { useAtom } from "jotai";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { NoMcpServers } from "@/components/a1/empty-states/no-mcp-servers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

export default function McpSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit, setParallelLoadLimit] = useAtom(
    mcpParallelLoadLimitAtom,
  );

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
        i === index ? { ...server, ...updates } : server,
      ),
    );
  };

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<number | null>(null);
  const [newServerName, setNewServerName] = useState("");
  const [newServerCommand, setNewServerCommand] = useState("");
  const [newServerTimeoutSec, setNewServerTimeoutSec] = useState(30);
  const [newServerRequiresApproval, setNewServerRequiresApproval] =
    useState(false);

  const isAddFormValid =
    newServerName.trim() !== "" &&
    newServerCommand.trim() !== "" &&
    newServerTimeoutSec >= 0.1;

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    const newServer: McpServerConfig = {
      id: `server-${Date.now()}`,
      name: newServerName.trim(),
      command: newServerCommand.trim(),
      enabled: true,
      timeoutMs: newServerTimeoutSec * 1000,
      requiresApproval: newServerRequiresApproval,
    };
    setMcpServers((prev) => [newServer, ...prev]);

    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeoutSec(30);
    setNewServerRequiresApproval(false);
    setShowAddDialog(false);
  };

  const handleCancelAdd = () => {
    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeoutSec(30);
    setNewServerRequiresApproval(false);
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
    <Card>
      <CardHeader>
        <CardTitle>MCP Servers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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
          <NoMcpServers />
        ) : (
          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {mcpServers.map((server, index) => (
              <AccordionItem key={server.id} value={server.id}>
                <AccordionTrigger className="px-3 hover:no-underline">
                  <div className="flex flex-1 items-center justify-between">
                    <span>{server.name || "Unnamed Server"}</span>
                    <Switch
                      id={`enabled-${server.id}`}
                      checked={server.enabled}
                      onCheckedChange={(checked) =>
                        updateMcpServer(index, { enabled: checked })
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="grid flex-1 gap-1.5">
                        <Label
                          htmlFor={`name-${server.id}`}
                          className="text-xs"
                        >
                          Name
                        </Label>
                        <Input
                          id={`name-${server.id}`}
                          value={server.name}
                          onChange={(e) =>
                            updateMcpServer(index, { name: e.target.value })
                          }
                          placeholder="Server name"
                        />
                      </div>

                      <div className="grid gap-1.5 sm:w-32">
                        <Label
                          htmlFor={`timeout-${server.id}`}
                          className="text-xs"
                        >
                          Timeout (sec)
                        </Label>
                        <Input
                          id={`timeout-${server.id}`}
                          type="number"
                          min="1"
                          max="300"
                          value={Math.round(server.timeoutMs / 1000)}
                          onChange={(e) =>
                            updateMcpServer(index, {
                              timeoutMs:
                                (parseInt(e.target.value) || 30) * 1000,
                            })
                          }
                          placeholder="30"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label
                        htmlFor={`command-${server.id}`}
                        className="text-xs"
                      >
                        Command
                      </Label>
                      <Input
                        id={`command-${server.id}`}
                        value={server.command}
                        onChange={(e) =>
                          updateMcpServer(index, { command: e.target.value })
                        }
                        placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`approval-${server.id}`}
                          className="text-sm"
                        >
                          Require Approval
                        </Label>
                        <span className="text-muted-foreground text-xs">
                          Ask for confirmation before running tools from this
                          server
                        </span>
                      </div>
                      <Switch
                        id={`approval-${server.id}`}
                        checked={server.requiresApproval ?? false}
                        onCheckedChange={(checked) =>
                          updateMcpServer(index, {
                            requiresApproval: checked,
                          })
                        }
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(index)}
                      className="w-fit"
                    >
                      <Trash2Icon className="size-4" />
                      Delete Server
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new MCP server to extend the AI&apos;s capabilities.
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
              <Label htmlFor="server-timeout">Timeout (seconds)</Label>
              <Input
                id="server-timeout"
                type="number"
                min="0.1"
                max="300"
                step="0.1"
                value={newServerTimeoutSec}
                onChange={(e) =>
                  setNewServerTimeoutSec(parseFloat(e.target.value))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="server-approval" className="text-sm">
                  Require Approval
                </Label>
                <span className="text-muted-foreground text-xs">
                  Ask for confirmation before running tools from this server
                </span>
              </div>
              <Switch
                id="server-approval"
                checked={newServerRequiresApproval}
                onCheckedChange={setNewServerRequiresApproval}
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
    </Card>
  );
}
