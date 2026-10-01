import { IconArrowLeft, IconFilter, IconInfoCircle, IconPlus, IconTool } from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { SearchInput } from "@/components/a1/search-input";
import { SettingsLink } from "@/components/a1/settings-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { useExtensionList } from "@/hooks/use-extension-list";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { mcpServersAtom } from "@/lib/jotai/unsynced-local-atoms";
import {
  type McpRegistryExtension,
  type McpRegistryInstallResult,
} from "@/lib/mcp-registry/install";
import {
  createInstalledRegistryMetadata,
  getInstalledRegistryMetadata,
} from "@/lib/mcp-registry/metadata";
import { getRegistryExtension } from "@/lib/mcp-registry/storage";
import { extensionListStatusAtom } from "@/lib/mcp-registry/sync";
import { type McpServerConfig } from "@/lib/settings/types";

import { AddServerDialog } from "./add-server-dialog";
import { DanglingExtensionsDialog } from "./dangling-extensions-dialog";
import { ExtensionAdvancedDetails } from "./extension-advanced-details";
import { ExtensionsBrowser, type ExtensionListItem } from "./extensions-browser";
import { InstallExtensionDialog } from "./install-extension-dialog";
import { UninstallExtensionDialog } from "./uninstall-extension-dialog";

export default function ExtensionsRoute() {
  const navigate = useNavigate();
  const [mcpServers, setMcpServers] = useAtom(mcpServersAtom);
  const [mcpAuthStates] = useAtom(mcpAuthStatesAtom);
  const [mcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const { restartMcpServer } = useTools();

  const chatId = searchParams.get("chatId");

  const handleNavigateBack = () => {
    if (chatId) {
      void navigate(`/chat/${chatId}`);
    } else {
      void navigate("/chat");
    }
  };

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

  const extensionListStatus = useAtomValue(extensionListStatusAtom);
  const {
    extensions: registryExtensions,
    installedIds,
    knownRegistryNames,
    hasMore,
    isSearching,
    error: searchError,
    resetKey,
  } = useExtensionList(
    mcpServers,
    query,
    onlyInstalled,
    showDeviceExtensions,
    showOnlineExtensions,
  );
  const [preparingExtensionId, setPreparingExtensionId] = useState<string | null>(null);

  const prepareInstall = useCallback(
    async (name: string, version: string) => {
      if (preparingExtensionId !== null) return;
      setPreparingExtensionId(name);
      try {
        const extension = await getRegistryExtension(name, version);
        if (!extension || !extension.installTemplates.length) {
          toast.error("This extension is no longer available to install");
          return;
        }
        setSelectedExtension(extension);
        setShowInstallDialog(true);
      } catch {
        toast.error("Failed to load extension details");
      } finally {
        setPreparingExtensionId(null);
      }
    },
    [preparingExtensionId],
  );

  const updateMcpServerById = useCallback(
    (serverId: string, updates: Partial<McpServerConfig>) => {
      const currentServer = mcpServers.find((server) => server.id === serverId);
      const shouldRetryFailedServer =
        currentServer !== undefined &&
        mcpServerLoadStates[serverId]?.status === "error" &&
        updates.timeoutMs !== undefined &&
        updates.timeoutMs !== currentServer.timeoutMs;

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
      registryMetadata: selectedExtension
        ? createInstalledRegistryMetadata(selectedExtension)
        : undefined,
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

  const handleUninstallClick = useCallback((serverId: string, name: string) => {
    setServerToUninstall({ id: serverId, name });
    setShowUninstallDialog(true);
  }, []);

  const handleConfirmUninstall = () => {
    if (!serverToUninstall) return;

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

    for (const id of installedIds) {
      const server = mcpServers.find((server) => server.id === id);
      if (!server) continue;
      const metadata = getInstalledRegistryMetadata(server);
      const isStdio = server.type === "stdio";
      result.push({
        id: `custom-${server.id}`,
        title: server.name || metadata?.displayName || "Custom Extension",
        description: metadata?.description ?? (isStdio ? server.command : server.url),
        version: metadata?.version,
        iconUrl: metadata?.iconUrl,
        websiteUrl: metadata?.websiteUrl,
        badges: metadata?.badges,
        moreInfoJson: metadata?.registryEntry,
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
        onRestart: () => restartMcpServer(server.id),
        onUninstall: () => handleUninstallClick(server.id, server.name || "Custom Extension"),
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

    for (const extension of registryExtensions) {
      result.push({
        id: extension.id,
        title: extension.displayName,
        description: extension.description,
        searchText: [extension.displayName, extension.id, extension.searchText]
          .filter(Boolean)
          .join(" "),
        transportType: extension.installType ?? "stdio",
        transportTypes: extension.transportTypes.flatMap((type) =>
          type === "stdio"
            ? ["stdio" as const]
            : type === "streamable-http"
              ? ["http" as const]
              : [],
        ),
        installed: false,
        canUninstall: false,
        installSupported: extension.installSupported,
        installLoading: preparingExtensionId === extension.id,
        installDisabled: preparingExtensionId !== null,
        version: extension.version,
        iconUrl: extension.iconUrl,
        websiteUrl: extension.websiteUrl,
        badges: extension.categories.length > 0 ? extension.categories : extension.tags,
        onInstall: () => {
          void prepareInstall(extension.id, extension.version);
        },
      });
    }

    return result;
  }, [
    mcpServers,
    mcpAuthStates,
    mcpServerLoadStates,
    registryExtensions,
    installedIds,
    prepareInstall,
    preparingExtensionId,
    updateMcpServerById,
    handleUninstallClick,
    restartMcpServer,
  ]);

  return (
    <main className="flex h-svh min-h-0 flex-col" role="main">
      <header className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b p-4">
        <Button variant="outline" size="sm" onClick={handleNavigateBack}>
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <h1 className="text-base font-semibold">Extensions</h1>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 p-4 md:p-6">
        {extensionListStatus.isUpdating ||
        (extensionListStatus.isStartupComplete && !extensionListStatus.hasDownloadedList) ? (
          <Alert>
            <IconInfoCircle />
            <AlertTitle>
              {extensionListStatus.isUpdating
                ? "Extension updates are happening in the background."
                : "The extension list is not available yet."}
            </AlertTitle>
            <AlertDescription>
              If you're connected to the internet, the latest list of extensions{" "}
              <SettingsLink tab="about" id="setting-extension-list">
                should be downloading now.
              </SettingsLink>
            </AlertDescription>
          </Alert>
        ) : null}

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
                >
                  <IconFilter data-icon="inline-start" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-max">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Show</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={onlyInstalled}
                    onCheckedChange={(checked) => setOnlyInstalled(checked === true)}
                  >
                    Only show installed
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
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
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={
                      !extensionListStatus.hasDownloadedList ||
                      extensionListStatus.isUpdating ||
                      isSearching ||
                      Boolean(searchError)
                    }
                    onSelect={() => setShowDanglingDialog(true)}
                  >
                    <IconTool data-icon="inline-start" />
                    Find dangling extensions
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <IconPlus data-icon="inline-start" />
            Add Custom
          </Button>
        </div>

        <ExtensionsBrowser
          items={items}
          query={query}
          hasMore={hasMore}
          isSearching={isSearching}
          isLoading={
            !onlyInstalled &&
            (!extensionListStatus.isStartupComplete || extensionListStatus.isUpdating)
          }
          resetKey={resetKey}
        />
      </div>

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
        registryReady={
          extensionListStatus.hasDownloadedList &&
          !extensionListStatus.isUpdating &&
          !isSearching &&
          !searchError
        }
        onRemove={(serverId) => {
          const server = mcpServers.find((s) => s.id === serverId);
          setMcpServers((prev) => prev.filter((s) => s.id !== serverId));
          toast.success(`${server?.name || "Extension"} removed`);
        }}
        onRemoveAll={(serverIds) => {
          const ids = new Set(serverIds);
          setMcpServers((prev) => prev.filter((s) => !ids.has(s.id)));
          toast.success(`Removed ${serverIds.length} dangling extensions`);
          setShowDanglingDialog(false);
        }}
      />
    </main>
  );
}
