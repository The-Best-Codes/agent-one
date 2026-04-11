import { IconFilter, IconFlask, IconPlus, IconSearch } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
  type McpRegistryInstallResult,
} from "@/assets/mcp-registry/mcp-registry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { mcpServersAtom } from "@/lib/jotai/settings-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

import { AddServerDialog } from "./add-server-dialog";
import { BuiltInExtensionsTab } from "./built-in-extensions-tab";
import { ExtensionAdvancedDetails } from "./extension-advanced-details";
import { ExtensionsBrowser, type CustomServerEntry } from "./extensions-browser";
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
  return server.id === extension.id || server.id.includes(`registry-${registryIdFragment}`);
}

function isServerFromRegistry(server: McpServerConfig): boolean {
  return server.id.includes("@");
}

export default function ExtensionsSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [mcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);
  const [searchParams, setSearchParams] = useSearchParams();

  const mcpInstallPrefill = useMemo(() => {
    const name = searchParams.get("mcpName");
    const type = searchParams.get("mcpType");
    if (!name || !type) return null;
    return {
      name,
      type: type as "stdio" | "http",
      command: searchParams.get("mcpCommand") ?? undefined,
      url: searchParams.get("mcpUrl") ?? undefined,
    };
  }, [searchParams]);

  const [showAddDialog, setShowAddDialog] = useState(!!mcpInstallPrefill);
  const [addDialogInitialValues, setAddDialogInitialValues] = useState(mcpInstallPrefill);
  const [selectedExtension, setSelectedExtension] = useState<McpRegistryExtension | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [serverToUninstall, setServerToUninstall] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [showDeviceExtensions, setShowDeviceExtensions] = useState(true);
  const [showOnlineExtensions, setShowOnlineExtensions] = useState(true);

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

  const updateMcpServerById = useCallback(
    (serverId: string, updates: Partial<McpServerConfig>) => {
      setMcpServers((prev) =>
        prev.map((server) =>
          server.id === serverId ? ({ ...server, ...updates } as McpServerConfig) : server,
        ),
      );
    },
    [setMcpServers],
  );

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
            toolApprovalOverrides: {},
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
            toolApprovalOverrides: {},
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
      toolApprovalOverrides: {},
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

  const handleExtensionUninstallClick = useCallback(
    (extension: McpRegistryExtension) => {
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
    },
    [mcpServers],
  );

  const handleServerUninstallClick = useCallback((server: McpServerConfig) => {
    setServerToUninstall({
      id: server.id,
      name: server.name || "Custom Extension",
    });
    setShowUninstallDialog(true);
  }, []);

  const handleConfirmExtensionUninstall = () => {
    if (!serverToUninstall) {
      return;
    }

    setMcpServers((prev) => {
      const targetIndex = prev.findIndex((server) => server.id === serverToUninstall.id);

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
    return mcpServers.some((server) => isServerInstalledFromExtension(server, extension));
  };

  const getExtensionServer = (extension: McpRegistryExtension) => {
    return mcpServers.find((server) => isServerInstalledFromExtension(server, extension));
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

  const customServerEntries: CustomServerEntry[] = useMemo(
    () =>
      customServers.map((server) => {
        const linkedExtension = extensionByServerId.get(server.id);
        return {
          server,
          loadState: mcpServerLoadStates[server.id],
          advancedContent: (
            <ExtensionAdvancedDetails
              server={server}
              onUpdate={(updates) => updateMcpServerById(server.id, updates)}
            />
          ),
          onEnabledChange: (enabled: boolean) => updateMcpServerById(server.id, { enabled }),
          onUninstall: () =>
            linkedExtension
              ? handleExtensionUninstallClick(linkedExtension)
              : handleServerUninstallClick(server),
        };
      }),
    [
      customServers,
      mcpServerLoadStates,
      extensionByServerId,
      handleExtensionUninstallClick,
      handleServerUninstallClick,
      updateMcpServerById,
    ],
  );

  const sharedBrowserProps = {
    showDeviceExtensions,
    showOnlineExtensions,
    isInstalled: isExtensionInstalled,
    getServerForExtension: getExtensionServer,
    getLoadStateForExtension: (extension: McpRegistryExtension) => {
      const server = getExtensionServer(extension);
      return server ? mcpServerLoadStates[server.id] : undefined;
    },
    onInstallClick: handleExtensionInstallClick,
    onUninstallClick: handleExtensionUninstallClick,
    onEnabledChange: (serverId: string, enabled: boolean) =>
      updateMcpServerById(serverId, { enabled }),
    getAdvancedContent: renderAdvancedContent,
    getMoreInfoJson: (extension: McpRegistryExtension) => extension.registryEntry,
    customServers: customServerEntries,
  };

  const isTransportFilterDisabled = activeTab === "built-in";

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base leading-none font-semibold">Extensions</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert>
          <IconFlask />
          <AlertTitle>Extensions are in beta</AlertTitle>
          <AlertDescription>
            Some features may be incomplete or change without notice.
          </AlertDescription>
        </Alert>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="group/extensions-search-input relative flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-100 duration-200 group-focus-within/extensions-search-input:left-0 group-focus-within/extensions-search-input:opacity-0" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search extensions..."
                aria-label="Search extensions"
                className="bg-background pl-9 transition-[padding] duration-200 group-focus-within/extensions-search-input:pl-3"
              />
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <TabsList className="flex-1 justify-start md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="installed">Installed</TabsTrigger>
                <TabsTrigger value="built-in">Built-in</TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={isTransportFilterDisabled}
                    aria-label="Filter by connection"
                  >
                    <IconFilter data-icon="inline-start" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-max">
                  <DropdownMenuLabel>Filter by connection</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showDeviceExtensions}
                    onCheckedChange={(checked) => setShowDeviceExtensions(checked === true)}
                  >
                    Runs on this device
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showOnlineExtensions}
                    onCheckedChange={(checked) => setShowOnlineExtensions(checked === true)}
                  >
                    Connects online
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => setShowAddDialog(true)}>
                <IconPlus data-icon="inline-start" />
                Add Custom
              </Button>
            </div>
          </div>

          {[
            { value: "all", filter: "all" as const },
            { value: "installed", filter: "installed" as const },
          ].map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <ExtensionsBrowser filter={tab.filter} query={query} {...sharedBrowserProps} />
            </TabsContent>
          ))}

          <TabsContent value="built-in">
            <BuiltInExtensionsTab query={query} />
          </TabsContent>
        </Tabs>

        <AddServerDialog
          key={addDialogInitialValues ? "deeplink" : "manual"}
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setAddDialogInitialValues(null);
              if (mcpInstallPrefill) {
                setSearchParams((prev) => {
                  prev.delete("mcpName");
                  prev.delete("mcpType");
                  prev.delete("mcpCommand");
                  prev.delete("mcpUrl");
                  return prev;
                });
              }
            }
          }}
          onAddServer={handleAddServer}
          initialValues={addDialogInitialValues}
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
