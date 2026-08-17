import { IconFilter, IconFlask, IconPlus, IconTool } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { useTools } from "@/contexts/use-tools/tools-hooks";
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
  const { t } = useTranslation();
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [mcpAuthStates] = useAtom(mcpAuthStatesAtom);
  const [mcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const enabledToolCount = useEnabledToolCount();
  const { restartMcpServer } = useTools();

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
      const shouldRetryFailedServer =
        currentServer !== undefined &&
        mcpServerLoadStates[serverId]?.status === "error" &&
        updates.timeoutMs !== undefined &&
        updates.timeoutMs !== currentServer.timeoutMs;
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

      if (shouldRetryFailedServer) {
        restartMcpServer(serverId);
      }
    },
    [mcpServers, mcpServerLoadStates, restartMcpServer, setMcpServers],
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
    toast.success(t("extensions.installedToast", { name: installed.name }));
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
    toast.success(t("extensions.removed", { name: serverToUninstall.name }));
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
        ? t("extensions.oneToolEnabled")
        : t("extensions.toolsEnabledCount", { count: enabledToolCount, total: TOOL_IDS.length });
    result.push({
      id: "built-in",
      title: t("extensions.builtInExtensions"),
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
        title: server.name || t("extensions.customExtension"),
        description: isStdio ? server.command : server.url,
        searchText: [
          server.name || t("extensions.customExtension"),
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
        onRestart: () => restartMcpServer(server.id),
        onUninstall: () =>
          handleUninstallClick(server.id, server.name || t("extensions.customExtension")),
        advancedContent: (
          <ExtensionAdvancedDetails
            key={JSON.stringify(server)}
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
        transportTypes:
          extension.installTemplates.length > 0
            ? Array.from(new Set(extension.installTemplates.map((template) => template.type)))
            : undefined,
        installed,
        canUninstall: true,
        installSupported: extension.installTemplates.length > 0,
        version: extension.version,
        iconUrl: extension.iconUrl,
        websiteUrl: extension.websiteUrl,
        badges: extension.categories.length > 0 ? extension.categories : extension.tags,
        enabled: server?.enabled,
        loadState: server ? mcpServerLoadStates[server.id] : undefined,
        authState: server ? mcpAuthStates[server.id] : undefined,
        onInstall: () => {
          if (extension.installTemplates.length > 0) {
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
        onRestart: server ? () => restartMcpServer(server.id) : undefined,
        advancedContent:
          installed && server ? (
            <ExtensionAdvancedDetails
              key={JSON.stringify(server)}
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
    restartMcpServer,
    t,
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
        <h2 className="text-base leading-none font-semibold">{t("extensions.title")}</h2>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        <SettingsTarget id="setting-extensions-beta-notice">
          <Alert>
            <IconFlask />
            <AlertTitle>{t("extensions.betaTitle")}</AlertTitle>
            <AlertDescription>{t("extensions.betaDescription")}</AlertDescription>
          </Alert>
        </SettingsTarget>

        <SettingsTarget id="setting-extension-search-and-filters">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-row gap-0">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("extensions.search")}
                aria-label={t("extensions.searchAria")}
                className="rounded-r-none"
                containerClassName="flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="rounded-l-none border-l-0"
                    size="icon"
                    variant="outline"
                    aria-label={t("extensions.filterAria")}
                    analytics={{ event: "extension_filters_opened" }}
                  >
                    <IconFilter data-icon="inline-start" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-max">
                  <DropdownMenuLabel>{t("extensions.show")}</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={onlyInstalled}
                    onCheckedChange={(checked) => setOnlyInstalled(checked === true)}
                  >
                    {t("extensions.onlyShowInstalled")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("extensions.connectionType")}</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={showDeviceExtensions}
                    onCheckedChange={(checked) => setShowDeviceExtensions(checked === true)}
                  >
                    {t("extensions.runsOnThisDevice")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showOnlineExtensions}
                    onCheckedChange={(checked) => setShowOnlineExtensions(checked === true)}
                  >
                    {t("extensions.connectsOnline")}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setShowDanglingDialog(true)}>
                    <IconTool data-icon="inline-start" />
                    {t("extensions.findDangling")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              analytics={{ event: "custom_extension_dialog_opened" }}
            >
              <IconPlus data-icon="inline-start" />
              {t("extensions.addCustomAction")}
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
            toast.success(
              t("extensions.removed", { name: server?.name || t("extensions.extensionFallback") }),
            );
          }}
          onRemoveAll={(serverIds) => {
            trackGoogleAnalyticsEvent("extension_removed", {
              extension_source: "dangling_bulk",
              removed_count: serverIds.length,
            });
            const ids = new Set(serverIds);
            setMcpServers((prev) => prev.filter((s) => !ids.has(s.id)));
            toast.success(t("extensions.removedDangling", { count: serverIds.length }));
            setShowDanglingDialog(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
