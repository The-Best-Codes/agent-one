import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import {
  type McpRegistryExtension,
  type McpRegistryInstallResult,
} from "@/assets/mcp-registry/mcp-registry";
import { NoMcpServers } from "@/components/a1/empty-states/no-mcp-servers";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

import { AddServerDialog } from "./add-server-dialog";
import { DeleteServerDialog } from "./delete-server-dialog";
import { ExtensionsBrowser } from "./extensions-browser";
import { InstallExtensionDialog } from "./install-extension-dialog";
import { ServerListItem } from "./server-list-item";
import { UninstallExtensionDialog } from "./uninstall-extension-dialog";

function toRegistryIdFragment(registryName: string): string {
  return registryName.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function isServerInstalledFromExtension(
  server: McpServerConfig,
  extension: McpRegistryExtension,
): boolean {
  const registryIdFragment = toRegistryIdFragment(extension.registryName);
  return (
    server.id.includes(`registry-${registryIdFragment}`) ||
    server.name === extension.displayName ||
    server.name === extension.registryName
  );
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
  const [selectedExtension, setSelectedExtension] =
    useState<McpRegistryExtension | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [extensionToUninstall, setExtensionToUninstall] =
    useState<McpRegistryExtension | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);

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

  const handleInstallExtension = (installed: McpRegistryInstallResult) => {
    const registryName = selectedExtension?.registryName;
    const idPrefix = registryName
      ? `server-${uniqueId}-registry-${toRegistryIdFragment(registryName)}`
      : `server-${uniqueId}`;
    const baseServer = {
      id: `${idPrefix}-${crypto.randomUUID()}`,
      name: installed.name,
      enabled: true,
      timeoutMs: installed.timeoutSec * 1000,
      requiresApproval: installed.requiresApproval,
    };

    const newServer: McpServerConfig =
      installed.type === "stdio"
        ? {
            ...baseServer,
            type: "stdio",
            command: installed.command,
            env: installed.env,
          }
        : {
            ...baseServer,
            type: "http",
            url: installed.url,
            headers: installed.headers,
          };

    setMcpServers((prev) => [newServer, ...prev]);
    toast.success(`${installed.name} installed`);
  };

  const handleExtensionUninstallClick = (extension: McpRegistryExtension) => {
    setExtensionToUninstall(extension);
    setShowUninstallDialog(true);
  };

  const handleConfirmExtensionUninstall = () => {
    if (!extensionToUninstall) {
      return;
    }

    let removedServerName: string | null = null;

    setMcpServers((prev) => {
      const targetIndex = prev.findIndex((server) =>
        isServerInstalledFromExtension(server, extensionToUninstall),
      );

      if (targetIndex === -1) {
        return prev;
      }

      removedServerName =
        prev[targetIndex]?.name ?? extensionToUninstall.displayName;
      return prev.filter((_, index) => index !== targetIndex);
    });

    toast.success(
      `${removedServerName ?? extensionToUninstall.displayName} removed`,
    );
    setExtensionToUninstall(null);
    setShowUninstallDialog(false);
  };

  const handleCancelExtensionUninstall = () => {
    setExtensionToUninstall(null);
    setShowUninstallDialog(false);
  };

  const handleExtensionInstallClick = (extension: McpRegistryExtension) => {
    if (!extension.install) {
      return;
    }

    setSelectedExtension(extension);
    setShowInstallDialog(true);
  };

  const isExtensionInstalled = (extension: McpRegistryExtension): boolean => {
    return mcpServers.some((server) =>
      isServerInstalledFromExtension(server, extension),
    );
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

        <Tabs defaultValue="servers" className="w-full">
          <TabsList>
            <TabsTrigger value="servers">Servers</TabsTrigger>
            <TabsTrigger value="extensions">Extensions</TabsTrigger>
          </TabsList>

          <TabsContent value="servers" className="mt-3 flex flex-col gap-3">
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
          </TabsContent>

          <TabsContent value="extensions" className="mt-3">
            <ExtensionsBrowser
              isInstalled={isExtensionInstalled}
              onInstallClick={handleExtensionInstallClick}
              onUninstallClick={handleExtensionUninstallClick}
            />
          </TabsContent>
        </Tabs>
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

      <InstallExtensionDialog
        extension={selectedExtension}
        open={showInstallDialog}
        onOpenChange={setShowInstallDialog}
        onInstall={handleInstallExtension}
      />

      <UninstallExtensionDialog
        extension={extensionToUninstall}
        open={showUninstallDialog}
        onOpenChange={setShowUninstallDialog}
        onConfirm={handleConfirmExtensionUninstall}
        onCancel={handleCancelExtensionUninstall}
      />
    </Card>
  );
}
