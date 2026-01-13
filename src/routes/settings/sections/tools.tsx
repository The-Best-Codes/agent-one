import { useAtom } from "jotai";
import { RotateCcwIcon, XIcon } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  dateTimeToolConfigAtom,
  enabledToolsAtom,
  getUrlContentToolConfigAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
  waitToolConfigAtom,
  webSearchToolConfigAtom,
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

const TOOL_DESCRIPTIONS: Record<ToolId, string> = {
  dateTime: "Get the current date and time",
  waitNumberMilliseconds: "Wait for a specified duration",
  getUrlContent: "Fetch and extract content from URLs",
  webSearch: "Search the web using DuckDuckGo",
};

export default function ToolsSection() {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit, setParallelLoadLimit] = useAtom(
    mcpParallelLoadLimitAtom,
  );

  const [dateTimeConfig, setDateTimeConfig] = useAtom(dateTimeToolConfigAtom);
  const [waitConfig, setWaitConfig] = useAtom(waitToolConfigAtom);
  const [webSearchConfig, setWebSearchConfig] = useAtom(
    webSearchToolConfigAtom,
  );
  const [getUrlContentConfig, setGetUrlContentConfig] = useAtom(
    getUrlContentToolConfigAtom,
  );

  const isEnabledToolsDefault =
    JSON.stringify(enabledTools) ===
    JSON.stringify(DEFAULT_SETTINGS.ENABLED_TOOLS);
  const isParallelLoadLimitDefault =
    parallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  const isToolConfigsDefault =
    JSON.stringify(dateTimeConfig) ===
      JSON.stringify(DEFAULT_SETTINGS.DATE_TIME_TOOL_CONFIG) &&
    JSON.stringify(waitConfig) ===
      JSON.stringify(DEFAULT_SETTINGS.WAIT_TOOL_CONFIG) &&
    JSON.stringify(webSearchConfig) ===
      JSON.stringify(DEFAULT_SETTINGS.WEB_SEARCH_TOOL_CONFIG) &&
    JSON.stringify(getUrlContentConfig) ===
      JSON.stringify(DEFAULT_SETTINGS.GET_URL_CONTENT_TOOL_CONFIG);

  const handleResetToolConfigs = () => {
    resetSetting("ENABLED_TOOLS");
    resetSetting("DATE_TIME_TOOL_CONFIG");
    resetSetting("WAIT_TOOL_CONFIG");
    resetSetting("WEB_SEARCH_TOOL_CONFIG");
    resetSetting("GET_URL_CONTENT_TOOL_CONFIG");
  };

  const handleResetParallelLoadLimit = () => {
    resetSetting("MCP_PARALLEL_LOAD_LIMIT");
  };

  const updateToolEnabled = (
    toolId: ToolId,
    enabled: boolean,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
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
                Enable tools and configure their behavior.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetToolConfigs}
                disabled={isToolConfigsDefault && isEnabledToolsDefault}
                aria-label="Reset all tool settings"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="dateTime">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="dateTime-enabled"
                    checked={enabledTools.dateTime}
                    onCheckedChange={(checked) =>
                      updateToolEnabled("dateTime", checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {TOOL_NAMES.dateTime}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {TOOL_DESCRIPTIONS.dateTime}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <Label htmlFor="dateTime-utc" className="text-sm">
                        Use UTC timezone
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Return times in UTC instead of local timezone
                      </span>
                    </div>
                    <Switch
                      id="dateTime-utc"
                      checked={dateTimeConfig.useUtc}
                      onCheckedChange={(checked) =>
                        setDateTimeConfig((prev) => ({
                          ...prev,
                          useUtc: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="waitNumberMilliseconds">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="wait-enabled"
                    checked={enabledTools.waitNumberMilliseconds}
                    onCheckedChange={(checked) =>
                      updateToolEnabled(
                        "waitNumberMilliseconds",
                        checked as boolean,
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {TOOL_NAMES.waitNumberMilliseconds}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {TOOL_DESCRIPTIONS.waitNumberMilliseconds}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Minimum wait (ms): {waitConfig.minMs}
                    </Label>
                    <Slider
                      value={[waitConfig.minMs]}
                      min={0}
                      max={waitConfig.maxMs}
                      step={100}
                      onValueChange={([value]) =>
                        setWaitConfig((prev) => ({ ...prev, minMs: value }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Maximum wait (ms): {waitConfig.maxMs}
                    </Label>
                    <Slider
                      value={[waitConfig.maxMs]}
                      min={waitConfig.minMs}
                      max={120000}
                      step={1000}
                      onValueChange={([value]) =>
                        setWaitConfig((prev) => ({ ...prev, maxMs: value }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="webSearch">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="webSearch-enabled"
                    checked={enabledTools.webSearch}
                    onCheckedChange={(checked) =>
                      updateToolEnabled("webSearch", checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {TOOL_NAMES.webSearch}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {TOOL_DESCRIPTIONS.webSearch}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <Label htmlFor="webSearch-approval" className="text-sm">
                        Require approval
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Ask for confirmation before executing
                      </span>
                    </div>
                    <Switch
                      id="webSearch-approval"
                      checked={webSearchConfig.requiresApproval}
                      onCheckedChange={(checked) =>
                        setWebSearchConfig((prev) => ({
                          ...prev,
                          requiresApproval: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Max concurrent searches: {webSearchConfig.maxConcurrent}
                    </Label>
                    <Slider
                      value={[webSearchConfig.maxConcurrent]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([value]) =>
                        setWebSearchConfig((prev) => ({
                          ...prev,
                          maxConcurrent: value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Default max results: {webSearchConfig.defaultMaxResults}
                    </Label>
                    <Slider
                      value={[webSearchConfig.defaultMaxResults]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={([value]) =>
                        setWebSearchConfig((prev) => ({
                          ...prev,
                          defaultMaxResults: value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Default max pages: {webSearchConfig.defaultMaxPages}
                    </Label>
                    <Slider
                      value={[webSearchConfig.defaultMaxPages]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([value]) =>
                        setWebSearchConfig((prev) => ({
                          ...prev,
                          defaultMaxPages: value,
                        }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="getUrlContent">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="getUrlContent-enabled"
                    checked={enabledTools.getUrlContent}
                    onCheckedChange={(checked) =>
                      updateToolEnabled("getUrlContent", checked as boolean)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {TOOL_NAMES.getUrlContent}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {TOOL_DESCRIPTIONS.getUrlContent}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <Label
                        htmlFor="getUrlContent-approval"
                        className="text-sm"
                      >
                        Require approval
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Ask for confirmation before executing
                      </span>
                    </div>
                    <Switch
                      id="getUrlContent-approval"
                      checked={getUrlContentConfig.requiresApproval}
                      onCheckedChange={(checked) =>
                        setGetUrlContentConfig((prev) => ({
                          ...prev,
                          requiresApproval: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Minimum URLs: {getUrlContentConfig.minUrls}
                    </Label>
                    <Slider
                      value={[getUrlContentConfig.minUrls]}
                      min={1}
                      max={getUrlContentConfig.maxUrls}
                      step={1}
                      onValueChange={([value]) =>
                        setGetUrlContentConfig((prev) => ({
                          ...prev,
                          minUrls: value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm">
                      Maximum URLs: {getUrlContentConfig.maxUrls}
                    </Label>
                    <Slider
                      value={[getUrlContentConfig.maxUrls]}
                      min={getUrlContentConfig.minUrls}
                      max={20}
                      step={1}
                      onValueChange={([value]) =>
                        setGetUrlContentConfig((prev) => ({
                          ...prev,
                          maxUrls: value,
                        }))
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
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
            <div className="space-y-2">
              {mcpServers.map((server, index) => (
                <Card key={server.id} className="relative border py-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(index)}
                    aria-label="Remove server"
                    className="absolute top-2 right-2 size-6"
                  >
                    <XIcon className="size-4" />
                  </Button>
                  <CardContent className="grid gap-3 p-4">
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

                    <div className="flex items-end gap-3">
                      <div className="grid flex-1 gap-1.5">
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

                      <div className="grid gap-1.5">
                        <Label
                          htmlFor={`enabled-${server.id}`}
                          className="text-xs"
                        >
                          Enabled
                        </Label>
                        <div className="flex h-9 items-center justify-end">
                          <Switch
                            id={`enabled-${server.id}`}
                            checked={server.enabled}
                            onCheckedChange={(checked) =>
                              updateMcpServer(index, { enabled: checked })
                            }
                          />
                        </div>
                      </div>
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
