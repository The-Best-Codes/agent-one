import { IconAdjustmentsHorizontal, IconArrowLeft, IconCompass } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRegistrySummaries } from "@/hooks/use-extension-registry";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import { getInstalledRegistryMetadata } from "@/lib/mcp-registry/metadata";
import { extensionListStatusAtom } from "@/lib/mcp-registry/sync";
import { type McpServerConfig } from "@/lib/settings/types";

import { AddCustomDialog, type CustomExtensionPrefill } from "./add-custom-dialog";
import { ExploreTab } from "./explore-tab";
import { ExtensionDetails } from "./extension-details";
import { InstallExtensionDialog } from "./install-extension-dialog";
import { ManageTab } from "./manage-tab";
import { useInstalledExtensions } from "./use-installed-extensions";

type Tab = "explore" | "manage";

function TabNav({
  tab,
  installedCount,
  orientation,
  onChange,
}: {
  tab: Tab;
  installedCount: number;
  orientation: "horizontal" | "vertical";
  onChange: (tab: Tab) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={tab}
      orientation={orientation}
      onValueChange={(value) => {
        if (value) onChange(value as Tab);
      }}
      className="bg-background border-border flex w-full gap-0 border data-vertical:flex-col"
    >
      <ToggleGroupItem
        value="explore"
        className="data-[state=on]:bg-input flex-1 justify-start rounded-md border-0 px-4 shadow-none transition-none"
      >
        <IconCompass />
        Explore
      </ToggleGroupItem>
      <ToggleGroupItem
        value="manage"
        className="data-[state=on]:bg-input flex-1 justify-start rounded-md border-0 px-4 shadow-none transition-none"
      >
        <IconAdjustmentsHorizontal />
        Manage
        {installedCount > 0 ? (
          <Badge variant="secondary" className="ml-auto">
            {installedCount}
          </Badge>
        ) : null}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export default function ExtensionsRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rootRef = useRef<HTMLElement>(null);
  const { servers, installedIds, addServer, updateServer, removeServer, restartMcpServer } =
    useInstalledExtensions();
  const listStatus = useAtomValue(extensionListStatusAtom);

  const [installTarget, setInstallTarget] = useState<McpRegistrySummary | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [installKey, setInstallKey] = useState(0);
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [addCustomKey, setAddCustomKey] = useState(0);

  const prefill = useMemo<CustomExtensionPrefill | null>(() => {
    const name = searchParams.get("mcpName");
    const type = searchParams.get("mcpType");
    if (!name || (type !== "stdio" && type !== "http")) return null;
    return {
      name,
      type,
      command: searchParams.get("mcpCommand") ?? undefined,
      url: searchParams.get("mcpUrl") ?? undefined,
    };
  }, [searchParams]);

  const detailsId = searchParams.get("extension");
  const detailsServer = detailsId ? servers.find((server) => server.id === detailsId) : undefined;
  const tab: Tab =
    searchParams.get("tab") === "manage" || detailsServer || prefill ? "manage" : "explore";

  const registryIds = useMemo(
    () =>
      servers
        .filter((server) => getInstalledRegistryMetadata(server) !== undefined)
        .map((server) => server.id),
    [servers],
  );
  const registrySummaries = useRegistrySummaries(registryIds);
  const delistedIds = useMemo(
    () =>
      new Set(
        listStatus.hasDownloadedList && registrySummaries
          ? registryIds.filter((id) => !registrySummaries.has(id))
          : [],
      ),
    [listStatus.hasDownloadedList, registryIds, registrySummaries],
  );

  const navigateWithin = (updates: { tab?: Tab; extension?: string | null }) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (updates.tab) next.set("tab", updates.tab);
      if (updates.extension) next.set("extension", updates.extension);
      else next.delete("extension");
      return next;
    });
    rootRef.current?.scrollIntoView({ block: "start" });
  };

  const openDetails = (id: string) => navigateWithin({ tab: "manage", extension: id });

  const handleBack = () => {
    const chatId = searchParams.get("chatId");
    void navigate(chatId ? `/chat/${chatId}` : "/chat");
  };

  const handleInstall = (server: McpServerConfig) => {
    addServer(server);
    setInstallOpen(false);
    toast.success(`${server.name} installed`, {
      action: { label: "Manage", onClick: () => openDetails(server.id) },
    });
  };

  const clearPrefill = (extension?: string) => {
    if (!prefill && !extension) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const key of ["mcpName", "mcpType", "mcpCommand", "mcpUrl"]) next.delete(key);
      next.set("tab", "manage");
      if (extension) next.set("extension", extension);
      return next;
    });
  };

  const handleAddCustom = (server: McpServerConfig) => {
    addServer(server);
    setAddCustomOpen(false);
    clearPrefill(server.id);
    toast.success(`${server.name} added`);
  };

  const openAddCustom = () => {
    setAddCustomKey((key) => key + 1);
    setAddCustomOpen(true);
  };

  const nav = (orientation: "horizontal" | "vertical") => (
    <TabNav
      tab={tab}
      installedCount={servers.length}
      orientation={orientation}
      onChange={(next) => navigateWithin({ tab: next, extension: null })}
    />
  );

  return (
    <main ref={rootRef} role="main" className="bg-background min-h-svh pl-[calc(100vw-100%)]">
      <h1 className="sr-only">Extensions</h1>
      <div className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b p-4 md:hidden">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        {nav("horizontal")}
      </div>

      <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <nav className="hidden w-48 shrink-0 flex-col gap-4 pl-0.5 md:sticky md:top-6 md:flex md:self-start lg:w-56">
            <Button variant="outline" onClick={handleBack} className="w-full">
              <IconArrowLeft data-icon="inline-start" />
              Back to Chat
            </Button>
            {nav("vertical")}
          </nav>

          <div className="min-w-0 flex-1">
            {tab === "explore" ? (
              <ExploreTab
                installedIds={installedIds}
                onInstall={(extension) => {
                  setInstallTarget(extension);
                  setInstallKey((key) => key + 1);
                  setInstallOpen(true);
                }}
                onManage={openDetails}
                onAddCustom={openAddCustom}
              />
            ) : detailsServer ? (
              <ExtensionDetails
                key={detailsServer.id}
                server={detailsServer}
                delisted={delistedIds.has(detailsServer.id)}
                onBack={() => navigateWithin({ tab: "manage", extension: null })}
                onUpdate={(updates) => updateServer(detailsServer.id, updates)}
                onRestart={() => restartMcpServer(detailsServer.id)}
                onUninstall={() => {
                  removeServer(detailsServer.id);
                  navigateWithin({ tab: "manage", extension: null });
                  toast.success(`${detailsServer.name} uninstalled`);
                }}
              />
            ) : (
              <ManageTab
                servers={servers}
                delistedIds={delistedIds}
                onToggle={(id, enabled) => updateServer(id, { enabled })}
                onOpen={openDetails}
                onAddCustom={openAddCustom}
                onExplore={() => navigateWithin({ tab: "explore", extension: null })}
              />
            )}
          </div>
        </div>
      </div>

      <InstallExtensionDialog
        key={installKey}
        extension={installTarget}
        open={installOpen}
        onOpenChange={setInstallOpen}
        onInstall={handleInstall}
      />

      <AddCustomDialog
        key={prefill ? "prefill" : addCustomKey}
        open={addCustomOpen || prefill !== null}
        prefill={prefill}
        onOpenChange={(open) => {
          setAddCustomOpen(open);
          if (!open) clearPrefill();
        }}
        onAdd={handleAddCustom}
      />
    </main>
  );
}
