import { invoke } from "@tauri-apps/api/core";
import { useAtom } from "jotai";
import { PlusIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { closeServerCache } from "@/lib/ai/tools/mcp";
import {
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type McpHttpServerConfig,
  type McpServerConfig,
  type McpServerType,
} from "@/lib/settings/types";

interface HeaderEntry {
  key: string;
  value: string;
}

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

  const [newServerType, setNewServerType] = useState<McpServerType>("stdio");
  const [newServerName, setNewServerName] = useState("");
  const [newServerCommand, setNewServerCommand] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerHeaders, setNewServerHeaders] = useState<HeaderEntry[]>([]);
  const [newServerTimeoutSec, setNewServerTimeoutSec] = useState(30);
  const [newServerRequiresApproval, setNewServerRequiresApproval] =
    useState(false);
  const [newServerDisableOAuth, setNewServerDisableOAuth] = useState(false);

  const isAddFormValid =
    newServerName.trim() !== "" &&
    newServerTimeoutSec >= 0.1 &&
    (newServerType === "stdio"
      ? newServerCommand.trim() !== ""
      : newServerUrl.trim() !== "");

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    const baseConfig = {
      id: `server-${uniqueId}-${crypto.randomUUID()}`,
      name: newServerName.trim(),
      enabled: true,
      timeoutMs: newServerTimeoutSec * 1000,
      requiresApproval: newServerRequiresApproval,
    };

    let newServer: McpServerConfig;
    if (newServerType === "stdio") {
      newServer = {
        ...baseConfig,
        type: "stdio",
        command: newServerCommand.trim(),
      };
    } else {
      const headers: Record<string, string> = {};
      for (const entry of newServerHeaders) {
        if (entry.key.trim() && entry.value.trim()) {
          headers[entry.key.trim()] = entry.value.trim();
        }
      }
      newServer = {
        ...baseConfig,
        type: "http",
        url: newServerUrl.trim(),
        headers,
        disableOAuth: newServerDisableOAuth,
      };
    }

    setMcpServers((prev) => [newServer, ...prev]);
    resetAddForm();
    setShowAddDialog(false);
  };

  const resetAddForm = () => {
    setNewServerType("stdio");
    setNewServerName("");
    setNewServerCommand("");
    setNewServerUrl("");
    setNewServerHeaders([]);
    setNewServerTimeoutSec(30);
    setNewServerRequiresApproval(false);
    setNewServerDisableOAuth(false);
  };

  const handleCancelAdd = () => {
    resetAddForm();
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

  const addHeaderEntry = () => {
    setNewServerHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateHeaderEntry = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setNewServerHeaders((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const removeHeaderEntry = (index: number) => {
    setNewServerHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const getServerTypeLabel = (server: McpServerConfig) => {
    return server.type === "stdio" ? "STDIO" : "HTTP";
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
                    onCheckedChange={(checked) =>
                      updateMcpServer(index, { enabled: checked })
                    }
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Enable ${server.name || "server"}`}
                  />
                </div>
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

                    {server.type === "stdio" ? (
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
                    ) : (
                      <>
                        <div className="grid gap-1.5">
                          <Label
                            htmlFor={`url-${server.id}`}
                            className="text-xs"
                          >
                            URL
                          </Label>
                          <Input
                            id={`url-${server.id}`}
                            value={server.url}
                            onChange={(e) =>
                              updateMcpServer(index, { url: e.target.value })
                            }
                            placeholder="https://mcp.example.com/api"
                          />
                        </div>
                        <HttpHeadersEditor
                          serverId={server.id}
                          headers={server.headers}
                          onChange={(headers) =>
                            updateMcpServer(index, { headers })
                          }
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <Label
                              htmlFor={`disable-oauth-${server.id}`}
                              className="text-sm"
                            >
                              Opt out of OAuth
                            </Label>
                            <span className="text-muted-foreground text-xs">
                              Do not attempt to authenticate with this server
                            </span>
                          </div>
                          <Switch
                            id={`disable-oauth-${server.id}`}
                            checked={
                              (server as McpHttpServerConfig).disableOAuth ??
                              false
                            }
                            onCheckedChange={(checked) =>
                              updateMcpServer(index, {
                                disableOAuth: checked,
                              })
                            }
                          />
                        </div>

                        {!(server as McpHttpServerConfig).disableOAuth && (
                          <McpAuthStatus
                            server={server as McpHttpServerConfig}
                          />
                        )}
                      </>
                    )}

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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new MCP server to extend the AI&apos;s capabilities.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="server-type">Server Type</Label>
              <Select
                value={newServerType}
                onValueChange={(value: McpServerType) =>
                  setNewServerType(value)
                }
              >
                <SelectTrigger id="server-type">
                  <SelectValue placeholder="Select server type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stdio">STDIO (Local)</SelectItem>
                  <SelectItem value="http">HTTP (Remote)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {newServerType === "stdio"
                  ? "STDIO servers run locally via command line."
                  : "HTTP servers are remote endpoints that support the MCP protocol."}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="server-name">Name</Label>
              <Input
                id="server-name"
                placeholder="e.g., Everything Server"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
              />
            </div>

            {newServerType === "stdio" ? (
              <div className="grid gap-2">
                <Label htmlFor="server-command">Command</Label>
                <Input
                  id="server-command"
                  placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                  value={newServerCommand}
                  onChange={(e) => setNewServerCommand(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="server-url">URL</Label>
                  <Input
                    id="server-url"
                    placeholder="https://mcp.example.com/api"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>HTTP Headers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addHeaderEntry}
                    >
                      <PlusIcon className="size-4" />
                      Add Header
                    </Button>
                  </div>
                  {newServerHeaders.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {newServerHeaders.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            placeholder="Header name"
                            value={entry.key}
                            onChange={(e) =>
                              updateHeaderEntry(idx, "key", e.target.value)
                            }
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={entry.value}
                            onChange={(e) =>
                              updateHeaderEntry(idx, "value", e.target.value)
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHeaderEntry(idx)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No headers configured. Add headers for authentication or
                      other purposes.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <Label htmlFor="server-disable-oauth" className="text-sm">
                      Opt out of OAuth
                    </Label>
                    <span className="text-muted-foreground text-xs">
                      Do not attempt to authenticate with this server
                    </span>
                  </div>
                  <Switch
                    id="server-disable-oauth"
                    checked={newServerDisableOAuth}
                    onCheckedChange={setNewServerDisableOAuth}
                  />
                </div>
              </>
            )}

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

function McpAuthStatus({ server }: { server: McpHttpServerConfig }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshTools } = useTools();

  const checkAuth = async () => {
    try {
      await invoke("mcp_get_token", {
        serverId: server.id,
        serverUrl: server.url,
      });
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [server.id, server.url]);

  const handleLogin = async () => {
    setLoading(true);
    const toastId = toast.loading("Starting OAuth flow...");
    try {
      await invoke("mcp_authenticate", {
        serverId: server.id,
        serverUrl: server.url,
      });
      toast.success("Logged in successfully", { id: toastId });
      closeServerCache(server.id);
      refreshTools();
      await checkAuth();
    } catch (e) {
      toast.error(`Login failed: ${e}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await invoke("mcp_logout", { serverId: server.id });
      toast.success("Logged out successfully");
      closeServerCache(server.id);
      refreshTools();
      await checkAuth();
    } catch (e) {
      toast.error(`Logout failed: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex flex-col gap-1">
          <Label className="text-sm">Authentication Status</Label>
          <span className="text-muted-foreground text-xs">Checking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-sm">Authentication Status</Label>
        <span
          className={`text-xs ${isAuthenticated ? "text-green-600" : "text-muted-foreground"}`}
        >
          {isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </span>
      </div>
      {isAuthenticated ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
        >
          Logout
        </Button>
      ) : (
        <Button size="sm" onClick={handleLogin} disabled={loading}>
          Login
        </Button>
      )}
    </div>
  );
}

function HttpHeadersEditor({
  serverId,
  headers,
  onChange,
}: {
  serverId: string;
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}) {
  const entries = Object.entries(headers);

  const addHeader = () => {
    onChange({ ...headers, "": "" });
  };

  const updateHeader = (newKey: string, newValue: string, index: number) => {
    const newHeaders: Record<string, string> = {};
    let i = 0;
    for (const [key, value] of Object.entries(headers)) {
      if (i === index) {
        if (newKey.trim()) {
          newHeaders[newKey] = newValue;
        }
      } else {
        newHeaders[key] = value;
      }
      i++;
    }
    onChange(newHeaders);
  };

  const removeHeader = (keyToRemove: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[keyToRemove];
    onChange(newHeaders);
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">HTTP Headers</Label>
        <Button type="button" variant="outline" size="sm" onClick={addHeader}>
          <PlusIcon className="size-4" />
          Add
        </Button>
      </div>
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2">
          {entries.map(([key, value], idx) => (
            <div key={`${serverId}-header-${idx}`} className="flex gap-2">
              <Input
                placeholder="Header name"
                value={key}
                onChange={(e) => updateHeader(e.target.value, value, idx)}
                className="flex-1"
              />
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => updateHeader(key, e.target.value, idx)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHeader(key)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No headers configured.</p>
      )}
    </div>
  );
}
