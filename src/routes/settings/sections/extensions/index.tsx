import { IconFilter, IconFlask, IconPlus, IconTool } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
  type McpRegistryInstallResult,
} from "@/assets/mcp-registry/mcp-registry";
import { SearchInput } from "@/components/a1/search-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { mcpServersAtom } from "@/lib/jotai/settings-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

import SettingsTarget from "../../settings-target";
import { AddServerDialog } from "./add-server-dialog";
import { BuiltInExtensionsConfig } from "./built-in-extensions-config";
import { BUILT_IN_SEARCH_TEXT, TOOL_IDS, useEnabledToolCount } from "./built-in-extensions-utils";
import { DanglingExtensionsDialog } from "./dangling-extensions-dialog";
import { ExtensionAdvancedDetails } from "./extension-advanced-details";
import { ExtensionsBrowser, type ExtensionListItem } from "./extensions-browser";
import { InstallExtensionDialog } from "./install-extension-dialog";
import { UninstallExtensionDialog } from "./uninstall-extension-dialog";

function toRegistryIdFragment(registryName: string): string {
  return registryName.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getRegistryNameFromServerId(serverId: string): string | null {
  const atIdx = serverId.lastIndexOf("@");
  if (atIdx <= 0) return null;
  return serverId.slice(0, atIdx);
}

function isServerInstalledFromExtension(
  server: McpServerConfig,
  extension: McpRegistryExtension,
): boolean {
  if (server.id === extension.id) return true;
  const registryName = getRegistryNameFromServerId(server.id);
  if (registryName && registryName === extension.registryName) return true;
  const registryIdFragment = toRegistryIdFragment(extension.registryName);
  return server.id.includes(`registry-${registryIdFragment}`);
}

function isServerFromRegistry(server: McpServerConfig): boolean {
  return server.id.includes("@");
}

export default function ExtensionsSection() {
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [mcpAuthStates] = useAtom(mcpAuthStatesAtom);
  const [mcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const enabledToolCount = useEnabledToolCount();

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

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<McpRegistryExtension | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [serverToUninstall, setServerToUninstall] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showUninstallDialog, setShowUninstallDialog] = useState(false);
  const [showDanglingDialog, setShowDanglingDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyInstalled, setOnlyInstalled] = useState(false);
  const [showDeviceExtensions, setShowDeviceExtensions] = useState(true);
  const [showOnlineExtensions, setShowOnlineExtensions] = useState(true);

  const registryExtensions = useMemo(() => getMcpRegistryExtensions(), []);

  const knownRegistryNames = useMemo(
    () => new Set(registryExtensions.map((extension) => extension.registryName)),
    [registryExtensions],
  );

  const updateMcpServerById = useCallback(
    (serverId: string, updates: Partial<McpServerConfig>) => {
      const currentServer = mcpServers.find((server) => server.id === serverId);
      if (
        currentServer &&
        typeof updates.enabled === "boolean" &&
        updates.enabled !== currentServer.enabled
      ) {
        trackGoogleAnalyticsEvent("extension_enabled_changed", {
          extension_source: isServerFromRegistry(currentServer) ? "registry" : "custom",
          transport_type: currentServer.type,
          enabled: updates.enabled,
        });
      }

      setMcpServers((prev) =>
        prev.map((server) =>
          server.id === serverId ? ({ ...server, ...updates } as McpServerConfig) : server,
        ),
      );
    },
    [mcpServers, setMcpServers],
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
    trackGoogleAnalyticsEvent("extension_added", {
      extension_source: "custom",
      transport_type: newServer.type,
      requires_approval: newServer.requiresApproval,
    });
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
    trackGoogleAnalyticsEvent("extension_added", {
      extension_source: "registry",
      transport_type: newServer.type,
      requires_approval: newServer.requiresApproval,
    });
    toast.success(`${installed.name} installed`);
  };

  const handleUninstallClick = useCallback((serverId: string, name: string) => {
    setServerToUninstall({ id: serverId, name });
    setShowUninstallDialog(true);
  }, []);

  const handleConfirmUninstall = () => {
    if (!serverToUninstall) return;

    const server = mcpServers.find((item) => item.id === serverToUninstall.id);
    if (server) {
      trackGoogleAnalyticsEvent("extension_removed", {
        extension_source: isServerFromRegistry(server) ? "registry" : "custom",
        transport_type: server.type,
      });
    }

    setMcpServers((prev) => prev.filter((server) => server.id !== serverToUninstall.id));
    toast.success(`${serverToUninstall.name} removed`);
    setServerToUninstall(null);
    setShowUninstallDialog(false);
  };

  const handleCancelUninstall = () => {
    setServerToUninstall(null);
    setShowUninstallDialog(false);
  };

  const items: ExtensionListItem[] = useMemo(() => {
    const result: ExtensionListItem[] = [];

    // Built-in extensions card
    const toolCountLabel =
      enabledToolCount === 1
        ? "1 tool enabled"
        : `${enabledToolCount} of ${TOOL_IDS.length} tools enabled`;
    result.push({
      id: "built-in",
      title: "Built-in extensions",
      description: toolCountLabel,
      searchText: `built-in extensions ${BUILT_IN_SEARCH_TEXT}`,
      transportType: "built-in",
      installed: true,
      canUninstall: false,
      installSupported: false,
      advancedContent: <BuiltInExtensionsConfig />,
      advancedContentKey: "built-in",
    });

    // Custom servers (non-registry)
    const customServers = mcpServers.filter((s) => !isServerFromRegistry(s));
    for (const server of customServers) {
      const isStdio = server.type === "stdio";
      result.push({
        id: `custom-${server.id}`,
        title: server.name || "Custom Extension",
        description: isStdio ? server.command : server.url,
        searchText: [
          server.name || "Custom Extension",
          server.id,
          server.type,
          isStdio ? server.command : server.url,
        ]
          .filter(Boolean)
          .join(" "),
        transportType: server.type,
        installed: true,
        canUninstall: true,
        installSupported: true,
        enabled: server.enabled,
        loadState: mcpServerLoadStates[server.id],
        authState: mcpAuthStates[server.id],
        onEnabledChange: (enabled) => updateMcpServerById(server.id, { enabled }),
        onUninstall: () => handleUninstallClick(server.id, server.name || "Custom Extension"),
        advancedContent: (
          <ExtensionAdvancedDetails
            server={server}
            onUpdate={(updates) => updateMcpServerById(server.id, updates)}
          />
        ),
        advancedContentKey: server,
      });
    }

    // Registry extensions
    for (const extension of registryExtensions) {
      const server = mcpServers.find((s) => isServerInstalledFromExtension(s, extension));
      const installed = !!server;

      result.push({
        id: extension.id,
        title: extension.displayName,
        description: extension.description,
        searchText: [extension.displayName, extension.registryName, extension.searchText]
          .filter(Boolean)
          .join(" "),
        transportType: extension.installType ?? "stdio",
        installed,
        canUninstall: true,
        installSupported: Boolean(extension.install),
        version: extension.version,
        iconUrl: extension.iconUrl,
        websiteUrl: extension.websiteUrl,
        badges: extension.categories.length > 0 ? extension.categories : extension.tags,
        enabled: server?.enabled,
        loadState: server ? mcpServerLoadStates[server.id] : undefined,
        authState: server ? mcpAuthStates[server.id] : undefined,
        onInstall: () => {
          if (extension.install) {
            setSelectedExtension(extension);
            setShowInstallDialog(true);
          }
        },
        onUninstall: server
          ? () => handleUninstallClick(server.id, server.name || extension.displayName)
          : undefined,
        onEnabledChange: server
          ? (enabled) => updateMcpServerById(server.id, { enabled })
          : undefined,
        advancedContent:
          installed && server ? (
            <ExtensionAdvancedDetails
              server={server}
              onUpdate={(updates) => updateMcpServerById(server.id, updates)}
            />
          ) : undefined,
        advancedContentKey: server,
        moreInfoJson: installed ? extension.registryEntry : undefined,
      });
    }

    return result;
  }, [
    mcpServers,
    mcpAuthStates,
    mcpServerLoadStates,
    registryExtensions,
    enabledToolCount,
    updateMcpServerById,
    handleUninstallClick,
  ]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    const timeout = window.setTimeout(() => {
      trackGoogleAnalyticsEvent("extension_search_used", {
        query_length: trimmedQuery.length,
        only_installed: onlyInstalled,
        show_device_extensions: showDeviceExtensions,
        show_online_extensions: showOnlineExtensions,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [onlyInstalled, query, showDeviceExtensions, showOnlineExtensions]);

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="shrink-0">
        <h2 className="text-base leading-none font-semibold">Extensions</h2>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <SettingsTarget id="setting-extensions-beta-notice">
          <Alert>
            <IconFlask />
            <AlertTitle>Extensions are in beta</AlertTitle>
            <AlertDescription>
              Some features may be incomplete or change without notice.
            </AlertDescription>
          </Alert>
        </SettingsTarget>

        <SettingsTarget id="setting-extension-search-and-filters">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-row gap-0">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search extensions..."
                aria-label="Search extensions"
                className="rounded-r-none"
                containerClassName="flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-l-none border-l-0"
                    size="icon"
                    variant="outline"
                    aria-label="Filter extensions"
                    analytics={{ event: "extension_filters_opened" }}
                  >
                    <IconFilter data-icon="inline-start" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-max">
                  <DropdownMenuLabel>Show</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={onlyInstalled}
                    onCheckedChange={(checked) => setOnlyInstalled(checked === true)}
                  >
                    Only show installed
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Connection type</DropdownMenuLabel>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setShowDanglingDialog(true)}>
                    <IconTool data-icon="inline-start" />
                    Find dangling extensions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              analytics={{ event: "custom_extension_dialog_opened" }}
            >
              <IconPlus data-icon="inline-start" />
              Add Custom
            </Button>
          </div>
        </SettingsTarget>

        <ExtensionsBrowser
          items={items}
          query={query}
          onlyInstalled={onlyInstalled}
          showDeviceExtensions={showDeviceExtensions}
          showOnlineExtensions={showOnlineExtensions}
        />

        <AddServerDialog
          key={mcpInstallPrefill ? "deeplink" : "manual"}
          open={showAddDialog || !!mcpInstallPrefill}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open && mcpInstallPrefill) {
              setSearchParams((prev) => {
                prev.delete("mcpName");
                prev.delete("mcpType");
                prev.delete("mcpCommand");
                prev.delete("mcpUrl");
                return prev;
              });
            }
          }}
          onAddServer={handleAddServer}
          initialValues={mcpInstallPrefill}
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
          onConfirm={handleConfirmUninstall}
          onCancel={handleCancelUninstall}
        />

        <DanglingExtensionsDialog
          open={showDanglingDialog}
          onOpenChange={setShowDanglingDialog}
          mcpServers={mcpServers}
          knownRegistryNames={knownRegistryNames}
          onRemove={(serverId) => {
            const server = mcpServers.find((s) => s.id === serverId);
            if (server) {
              trackGoogleAnalyticsEvent("extension_removed", {
                extension_source: "dangling",
                transport_type: server.type,
              });
            }
            setMcpServers((prev) => prev.filter((s) => s.id !== serverId));
            toast.success(`${server?.name || "Extension"} removed`);
          }}
          onRemoveAll={(serverIds) => {
            trackGoogleAnalyticsEvent("extension_removed", {
              extension_source: "dangling_bulk",
              removed_count: serverIds.length,
            });
            const ids = new Set(serverIds);
            setMcpServers((prev) => prev.filter((s) => !ids.has(s.id)));
            toast.success(`Removed ${serverIds.length} dangling extensions`);
            setShowDanglingDialog(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
