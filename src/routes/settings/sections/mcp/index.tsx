import { useAtom } from "jotai";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
  type McpRegistryInstallResult,
} from "@/assets/mcp-registry/mcp-registry";
import { NoCustomExtensions } from "@/components/a1/empty-states/no-custom-extensions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mcpServersAtom } from "@/lib/jotai/settings-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

import { AddServerDialog } from "./add-server-dialog";
import { ExtensionAdvancedDetails } from "./extension-advanced-details";
import { ExtensionListRow } from "./extension-list-row";
import { ExtensionsBrowser } from "./extensions-browser";
import { InstallExtensionDialog } from "./install-extension-dialog";
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
    server.id === extension.id ||
    server.id.includes(`registry-${registryIdFragment}`)
  );
}

function isServerFromRegistry(server: McpServerConfig): boolean {
  return server.id.includes("@");
}

export default function McpSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExtension, setSelectedExtension] =
    useState<McpRegistryExtension | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [serverToUninstall, setServerToUninstall] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);

  const defaultExtensions = useMemo(() => getMcpRegistryExtensions(), []);

  const extensionByServerId = useMemo(() => {
    const map = new Map<string, McpRegistryExtension>();
    for (const extension of defaultExtensions) {
      map.set(extension.id, extension);
    }
    return map;
  }, [defaultExtensions]);

  const customServers = useMemo(
    () => mcpServers.filter((server) => !isServerFromRegistry(server)),
    [mcpServers],
  );

  const updateMcpServerById = (
    serverId: string,
    updates: Partial<McpServerConfig>,
  ) => {
    setMcpServers((prev) =>
      prev.map((server) =>
        server.id === serverId
          ? ({ ...server, ...updates } as McpServerConfig)
          : server,
      ),
    );
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
            id: crypto.randomUUID(),
            type: "stdio",
            name: serverData.name,
            command: serverData.command!,
            env: serverData.env || {},
            enabled: true,
            timeoutMs: serverData.timeoutSec * 1000,
            requiresApproval: serverData.requiresApproval,
          }
        : {
            id: crypto.randomUUID(),
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
    const extensionId = selectedExtension?.id;
    const baseServer = {
      id: extensionId ?? crypto.randomUUID(),
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
    const targetServer = mcpServers.find((server) =>
      isServerInstalledFromExtension(server, extension),
    );

    if (!targetServer) {
      return;
    }

    setServerToUninstall({
      id: targetServer.id,
      name: targetServer.name || extension.displayName,
    });
    setShowUninstallDialog(true);
  };

  const handleServerUninstallClick = (server: McpServerConfig) => {
    setServerToUninstall({
      id: server.id,
      name: server.name || "Custom Extension",
    });
    setShowUninstallDialog(true);
  };

  const handleConfirmExtensionUninstall = () => {
    if (!serverToUninstall) {
      return;
    }

    setMcpServers((prev) => {
      const targetIndex = prev.findIndex(
        (server) => server.id === serverToUninstall.id,
      );

      if (targetIndex === -1) {
        return prev;
      }

      return prev.filter((_, index) => index !== targetIndex);
    });

    toast.success(`${serverToUninstall.name} removed`);
    setServerToUninstall(null);
    setShowUninstallDialog(false);
  };

  const handleCancelExtensionUninstall = () => {
    setServerToUninstall(null);
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

  const getExtensionServer = (extension: McpRegistryExtension) => {
    return mcpServers.find((server) =>
      isServerInstalledFromExtension(server, extension),
    );
  };

  const renderAdvancedContent = (extension: McpRegistryExtension) => {
    const server = getExtensionServer(extension);
    if (!server) {
      return null;
    }

    return (
      <ExtensionAdvancedDetails
        server={server}
        onUpdate={(updates) => updateMcpServerById(server.id, updates)}
      />
    );
  };

  const sharedBrowserProps = {
    isInstalled: isExtensionInstalled,
    onInstallClick: handleExtensionInstallClick,
    onUninstallClick: handleExtensionUninstallClick,
    getAdvancedContent: renderAdvancedContent,
    getMoreInfoJson: (extension: McpRegistryExtension) =>
      extension.registryEntry,
  };

  // TODO: Reintroduce MCP parallel load limit in a dedicated runtime/performance settings section.

  return (
    <Card>
      <CardHeader>
        <h3 className="text-base leading-none font-semibold">Extensions</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs defaultValue="all" className="gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          {[
            { value: "all", filter: "all" as const },
            { value: "installed", filter: "installed" as const },
          ].map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <ExtensionsBrowser filter={tab.filter} {...sharedBrowserProps} />
            </TabsContent>
          ))}

          <TabsContent value="custom" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-medium">Custom Extensions</h4>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <PlusIcon className="size-4" />
                Add Custom
              </Button>
            </div>

            {customServers.length === 0 ? (
              <NoCustomExtensions />
            ) : (
              <div className="flex flex-col gap-2">
                {customServers.map((server) => {
                  const linkedExtension = extensionByServerId.get(server.id);

                  return (
                    <ExtensionListRow
                      key={server.id}
                      title={server.name || "Custom Extension"}
                      description={
                        server.type === "stdio" ? server.command : server.url
                      }
                      version="custom"
                      badges={["custom", server.type]}
                      installed
                      onUninstall={() =>
                        linkedExtension
                          ? handleExtensionUninstallClick(linkedExtension)
                          : handleServerUninstallClick(server)
                      }
                      advancedContent={
                        <ExtensionAdvancedDetails
                          server={server}
                          onUpdate={(updates) =>
                            updateMcpServerById(server.id, updates)
                          }
                        />
                      }
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AddServerDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddServer={handleAddServer}
        />

        <InstallExtensionDialog
          extension={selectedExtension}
          open={showInstallDialog}
          onOpenChange={setShowInstallDialog}
          onInstall={handleInstallExtension}
        />

        <UninstallExtensionDialog
          serverName={serverToUninstall?.name ?? null}
          open={showUninstallDialog}
          onOpenChange={setShowUninstallDialog}
          onConfirm={handleConfirmExtensionUninstall}
          onCancel={handleCancelExtensionUninstall}
        />
      </CardContent>
    </Card>
  );
}
