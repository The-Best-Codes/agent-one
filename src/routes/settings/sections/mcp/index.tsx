import { useAtom } from "jotai";
import { PlusIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
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

function toCustomExtension(server: McpServerConfig): McpRegistryExtension {
  return {
    id: server.id,
    registryName: server.name,
    displayName: server.name || "Custom Extension",
    description: server.type === "stdio" ? server.command : server.url,
    version: "custom",
    categories: ["custom"],
    tags: [server.type],
    keywords: [],
    packageCount: 0,
    requiredFieldCount: 0,
    transportTypes: [server.type],
    searchText: "custom",
    registryEntry: {
      server: {
        $schema: "",
        name: server.name || "custom",
        description: "Custom extension",
        version: "custom",
      },
      _meta: {
        "io.modelcontextprotocol.registry/official": {
          status: "custom",
          publishedAt: new Date(),
          updatedAt: new Date(),
          isLatest: true,
        },
      },
    },
  };
}

export default function McpSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const uniqueId = useId();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExtension, setSelectedExtension] =
    useState<McpRegistryExtension | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [extensionToUninstall, setExtensionToUninstall] =
    useState<McpRegistryExtension | null>(null);
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
    const extensionId = selectedExtension?.id;
    const baseServer = {
      id: extensionId ?? `server-${uniqueId}-${crypto.randomUUID()}`,
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

  const getExtensionServer = (extension: McpRegistryExtension) => {
    return mcpServers.find((server) =>
      isServerInstalledFromExtension(server, extension),
    );
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

          <TabsContent value="all">
            <ExtensionsBrowser
              filter="all"
              isInstalled={isExtensionInstalled}
              onInstallClick={handleExtensionInstallClick}
              onUninstallClick={handleExtensionUninstallClick}
              getAdvancedContent={(extension) => {
                const server = getExtensionServer(extension);
                if (!server) {
                  return null;
                }

                return (
                  <ExtensionAdvancedDetails
                    server={server}
                    onUpdate={(updates) =>
                      updateMcpServerById(server.id, updates)
                    }
                  />
                );
              }}
              getMoreInfoJson={(extension) => extension.registryEntry}
            />
          </TabsContent>

          <TabsContent value="installed">
            <ExtensionsBrowser
              filter="installed"
              isInstalled={isExtensionInstalled}
              onInstallClick={handleExtensionInstallClick}
              onUninstallClick={handleExtensionUninstallClick}
              getAdvancedContent={(extension) => {
                const server = getExtensionServer(extension);
                if (!server) {
                  return null;
                }

                return (
                  <ExtensionAdvancedDetails
                    server={server}
                    onUpdate={(updates) =>
                      updateMcpServerById(server.id, updates)
                    }
                  />
                );
              }}
              getMoreInfoJson={(extension) => extension.registryEntry}
            />
          </TabsContent>

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
                  const uninstallTarget =
                    linkedExtension ?? toCustomExtension(server);

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
                        handleExtensionUninstallClick(uninstallTarget)
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
          extension={extensionToUninstall}
          open={showUninstallDialog}
          onOpenChange={setShowUninstallDialog}
          onConfirm={handleConfirmExtensionUninstall}
          onCancel={handleCancelExtensionUninstall}
        />
      </CardContent>
    </Card>
  );
}
