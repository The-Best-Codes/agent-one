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
  toolConfigsAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type McpServerConfig,
  type ToolConfigs,
  type ToolId,
} from "@/lib/settings/types";

const TOOL_NAMES: Record<ToolId, string> = {
  dateTime: "Date & Time",
  waitNumberMilliseconds: "Wait Milliseconds",
  getUrlContent: "Get URL Content",
  webSearch: "Web Search",
};

const TOOL_DESCRIPTIONS: Record<ToolId, string> = {
  dateTime: "Get the current date and time",
  waitNumberMilliseconds: "Wait for a specified duration",
  getUrlContent: "Fetch and extract content from URLs",
  webSearch: "Search the web for information",
};

export default function ToolsSection() {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [toolConfigs, setToolConfigs] = useAtom(toolConfigsAtom);
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit, setParallelLoadLimit] = useAtom(
    mcpParallelLoadLimitAtom,
  );

  const isToolConfigsDefault =
    JSON.stringify({ ...enabledTools, ...toolConfigs }) ===
    JSON.stringify({
      ...DEFAULT_SETTINGS.ENABLED_TOOLS,
      ...DEFAULT_SETTINGS.TOOL_CONFIGS,
    });
  const isParallelLoadLimitDefault =
    parallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  const handleResetToolConfigs = () => {
    resetSetting("ENABLED_TOOLS");
    resetSetting("TOOL_CONFIGS");
  };

  const handleResetParallelLoadLimit = () => {
    resetSetting("MCP_PARALLEL_LOAD_LIMIT");
  };

  const updateToolEnabled = (toolId: ToolId, enabled: boolean) => {
    setEnabledTools((prev) => ({ ...prev, [toolId]: enabled }));
  };

  const updateToolConfig = <T extends ToolId>(
    toolId: T,
    updates: Partial<ToolConfigs[T]>,
  ) => {
    setToolConfigs((prev) => ({
      ...prev,
      [toolId]: { ...prev[toolId], ...updates },
    }));
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
    };
    setMcpServers((prev) => [newServer, ...prev]);

    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeoutSec(30);
    setShowAddDialog(false);
  };

  const handleCancelAdd = () => {
    setNewServerName("");
    setNewServerCommand("");
    setNewServerTimeoutSec(30);
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Static Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Tool Configuration</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Configure which built-in tools are available and their settings.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetToolConfigs}
              disabled={isToolConfigsDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {(Object.keys(TOOL_NAMES) as ToolId[]).map((toolId) => (
              <AccordionItem key={toolId} value={toolId}>
                <AccordionTrigger className="px-3 hover:no-underline">
                  <div className="flex flex-1 items-center gap-3">
                    <Checkbox
                      id={`enabled-${toolId}`}
                      checked={enabledTools[toolId]}
                      onCheckedChange={(checked) =>
                        updateToolEnabled(toolId, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {TOOL_NAMES[toolId]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {TOOL_DESCRIPTIONS[toolId]}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <Label
                          htmlFor={`approval-${toolId}`}
                          className="text-sm"
                        >
                          Require Approval
                        </Label>
                        <span className="text-muted-foreground text-xs">
                          Ask for confirmation before running this tool
                        </span>
                      </div>
                      <Switch
                        id={`approval-${toolId}`}
                        checked={toolConfigs[toolId].requiresApproval}
                        onCheckedChange={(checked) =>
                          updateToolConfig(toolId, {
                            requiresApproval: checked,
                          })
                        }
                      />
                    </div>

                    {toolId === "dateTime" && (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <Label htmlFor="dateTime-utc" className="text-sm">
                            Use UTC
                          </Label>
                          <span className="text-muted-foreground text-xs">
                            Return time in UTC instead of local timezone
                          </span>
                        </div>
                        <Switch
                          id="dateTime-utc"
                          checked={toolConfigs.dateTime.useUtc}
                          onCheckedChange={(checked) =>
                            updateToolConfig("dateTime", { useUtc: checked })
                          }
                        />
                      </div>
                    )}

                    {toolId === "waitNumberMilliseconds" && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="grid flex-1 gap-1.5">
                          <Label htmlFor="wait-min" className="text-xs">
                            Min Duration (ms)
                          </Label>
                          <Input
                            id="wait-min"
                            type="number"
                            min={0}
                            max={toolConfigs.waitNumberMilliseconds.maxMs}
                            value={toolConfigs.waitNumberMilliseconds.minMs}
                            onChange={(e) =>
                              updateToolConfig("waitNumberMilliseconds", {
                                minMs: Math.max(
                                  0,
                                  Math.min(
                                    parseInt(e.target.value) || 0,
                                    toolConfigs.waitNumberMilliseconds.maxMs,
                                  ),
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="grid flex-1 gap-1.5">
                          <Label htmlFor="wait-max" className="text-xs">
                            Max Duration (ms)
                          </Label>
                          <Input
                            id="wait-max"
                            type="number"
                            min={toolConfigs.waitNumberMilliseconds.minMs}
                            max={600000}
                            value={toolConfigs.waitNumberMilliseconds.maxMs}
                            onChange={(e) =>
                              updateToolConfig("waitNumberMilliseconds", {
                                maxMs: Math.max(
                                  toolConfigs.waitNumberMilliseconds.minMs,
                                  Math.min(
                                    parseInt(e.target.value) || 60000,
                                    600000,
                                  ),
                                ),
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {toolId === "getUrlContent" && (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="grid flex-1 gap-1.5">
                            <Label htmlFor="url-min" className="text-xs">
                              Min URLs
                            </Label>
                            <Input
                              id="url-min"
                              type="number"
                              min={1}
                              max={toolConfigs.getUrlContent.maxUrls}
                              value={toolConfigs.getUrlContent.minUrls}
                              onChange={(e) =>
                                updateToolConfig("getUrlContent", {
                                  minUrls: Math.max(
                                    1,
                                    Math.min(
                                      parseInt(e.target.value) || 1,
                                      toolConfigs.getUrlContent.maxUrls,
                                    ),
                                  ),
                                })
                              }
                            />
                          </div>
                          <div className="grid flex-1 gap-1.5">
                            <Label htmlFor="url-max" className="text-xs">
                              Max URLs
                            </Label>
                            <Input
                              id="url-max"
                              type="number"
                              min={toolConfigs.getUrlContent.minUrls}
                              max={200}
                              value={toolConfigs.getUrlContent.maxUrls}
                              onChange={(e) =>
                                updateToolConfig("getUrlContent", {
                                  maxUrls: Math.max(
                                    toolConfigs.getUrlContent.minUrls,
                                    Math.min(
                                      parseInt(e.target.value) || 5,
                                      200,
                                    ),
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="url-maxlength" className="text-xs">
                            Default Max Content Length
                          </Label>
                          <Input
                            id="url-maxlength"
                            type="number"
                            min={100}
                            max={50000}
                            value={toolConfigs.getUrlContent.defaultMaxLength}
                            onChange={(e) =>
                              updateToolConfig("getUrlContent", {
                                defaultMaxLength: Math.max(
                                  100,
                                  Math.min(
                                    parseInt(e.target.value) || 1000,
                                    50000,
                                  ),
                                ),
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                    {toolId === "webSearch" && (
                      <>
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor="search-concurrent"
                            className="text-xs"
                          >
                            Max Concurrent Searches
                          </Label>
                          <Input
                            id="search-concurrent"
                            type="number"
                            min={1}
                            max={50}
                            value={toolConfigs.webSearch.maxConcurrent}
                            onChange={(e) =>
                              updateToolConfig("webSearch", {
                                maxConcurrent: Math.max(
                                  1,
                                  Math.min(parseInt(e.target.value) || 3, 50),
                                ),
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <div className="grid flex-1 gap-1.5">
                            <Label htmlFor="search-results" className="text-xs">
                              Default Max Results
                            </Label>
                            <Input
                              id="search-results"
                              type="number"
                              min={1}
                              max={200}
                              value={toolConfigs.webSearch.defaultMaxResults}
                              onChange={(e) =>
                                updateToolConfig("webSearch", {
                                  defaultMaxResults: Math.max(
                                    1,
                                    Math.min(
                                      parseInt(e.target.value) || 20,
                                      200,
                                    ),
                                  ),
                                })
                              }
                            />
                          </div>
                          <div className="grid flex-1 gap-1.5">
                            <Label htmlFor="search-pages" className="text-xs">
                              Default Max Pages
                            </Label>
                            <Input
                              id="search-pages"
                              type="number"
                              min={1}
                              max={20}
                              value={toolConfigs.webSearch.defaultMaxPages}
                              onChange={(e) =>
                                updateToolConfig("webSearch", {
                                  defaultMaxPages: Math.max(
                                    1,
                                    Math.min(parseInt(e.target.value) || 1, 20),
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

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
      </Card>

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
