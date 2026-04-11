import { useVirtualizer } from "@tanstack/react-virtual";
import fuzzysort from "fuzzysort";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
} from "@/assets/mcp-registry/mcp-registry";
import { useOverflow } from "@/hooks/use-overflow";
import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import { type McpServerConfig } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

import { ExtensionListRow } from "./extension-list-row";

const ESTIMATED_EXTENSION_ITEM_HEIGHT = 148;

export interface CustomServerEntry {
  server: McpServerConfig;
  loadState?: McpServerLoadState;
  advancedContent?: ReactNode;
  onEnabledChange: (enabled: boolean) => void;
  onUninstall: () => void;
}

interface ExtensionsBrowserProps {
  filter?: "all" | "installed";
  query: string;
  showDeviceExtensions: boolean;
  showOnlineExtensions: boolean;
  isInstalled: (extension: McpRegistryExtension) => boolean;
  getServerForExtension?: (extension: McpRegistryExtension) => McpServerConfig | undefined;
  getLoadStateForExtension?: (extension: McpRegistryExtension) => McpServerLoadState | undefined;
  onInstallClick: (extension: McpRegistryExtension) => void;
  onUninstallClick: (extension: McpRegistryExtension) => void;
  onEnabledChange?: (serverId: string, enabled: boolean) => void;
  getAdvancedContent?: (extension: McpRegistryExtension) => ReactNode;
  getMoreInfoJson?: (extension: McpRegistryExtension) => unknown;
  customServers?: CustomServerEntry[];
}

export function ExtensionsBrowser({
  filter = "all",
  query,
  showDeviceExtensions,
  showOnlineExtensions,
  isInstalled,
  getServerForExtension,
  getLoadStateForExtension,
  onInstallClick,
  onUninstallClick,
  onEnabledChange,
  getAdvancedContent,
  getMoreInfoJson,
  customServers = [],
}: ExtensionsBrowserProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => getMcpRegistryExtensions(), []);

  type ListItem =
    | { kind: "registry"; extension: McpRegistryExtension }
    | { kind: "custom"; entry: CustomServerEntry };

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim();

    const transportFilteredExtensions = extensions.filter((extension) => {
      if (extension.installType === "stdio") {
        return showDeviceExtensions;
      }

      if (extension.installType === "http") {
        return showOnlineExtensions;
      }

      return showDeviceExtensions || showOnlineExtensions;
    });

    const baseExtensions =
      filter === "installed"
        ? transportFilteredExtensions.filter((extension) => isInstalled(extension))
        : transportFilteredExtensions;

    let registryItems: ListItem[];
    if (!normalizedQuery) {
      registryItems = baseExtensions.map((extension) => ({ kind: "registry" as const, extension }));
    } else {
      registryItems = baseExtensions
        .map((extension) => ({
          extension,
          score:
            fuzzysort.single(
              normalizedQuery,
              [extension.displayName, extension.registryName, extension.searchText]
                .filter(Boolean)
                .join(" "),
            )?.score ?? 0,
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ extension }) => ({ kind: "registry" as const, extension }));
    }

    // Custom servers are always "installed"
    let customItems: ListItem[];
    if (!normalizedQuery) {
      customItems = customServers.map((entry) => ({ kind: "custom" as const, entry }));
    } else {
      customItems = customServers
        .map((entry) => ({
          entry,
          score:
            fuzzysort.single(
              normalizedQuery,
              [
                entry.server.name || "Custom Extension",
                entry.server.id,
                entry.server.type,
                entry.server.type === "stdio" ? entry.server.command : entry.server.url,
              ]
                .filter(Boolean)
                .join(" "),
            )?.score ?? 0,
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ entry }) => ({ kind: "custom" as const, entry }));
    }

    return [...customItems, ...registryItems];
  }, [
    extensions,
    filter,
    isInstalled,
    query,
    showDeviceExtensions,
    showOnlineExtensions,
    customServers,
  ]);

  const isOverflowing = useOverflow(parentRef, {
    watch: `${filteredItems.length}:${filter}:${query}`,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => {
      const item = filteredItems[index];
      return item
        ? item.kind === "registry"
          ? item.extension.id
          : `custom-${item.entry.server.id}`
        : index;
    },
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
    virtualizer.scrollToOffset(0);
  }, [filter, query, showDeviceExtensions, showOnlineExtensions, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="max-h-96 scroll-py-1 overflow-x-hidden overflow-y-auto"
      aria-label="Extensions"
    >
      {filteredItems.length === 0 ? (
        <div className="text-muted-foreground rounded-md p-8 text-center text-sm">
          {filter === "installed"
            ? "No installed extensions match your search."
            : "No extensions match your search."}
        </div>
      ) : (
        <div className={cn(isOverflowing && "pr-2")}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = filteredItems[virtualItem.index];

              return (
                <div
                  key={
                    item.kind === "registry" ? item.extension.id : `custom-${item.entry.server.id}`
                  }
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full py-1 first:pt-0 last:pb-0"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.kind === "registry" ? (
                    (() => {
                      const extension = item.extension;
                      const installed = isInstalled(extension);
                      const server = getServerForExtension?.(extension);
                      return (
                        <ExtensionListRow
                          title={extension.displayName}
                          description={extension.description}
                          version={extension.version}
                          iconUrl={extension.iconUrl}
                          websiteUrl={extension.websiteUrl}
                          badges={
                            extension.categories.length > 0 ? extension.categories : extension.tags
                          }
                          installed={installed}
                          installSupported={Boolean(extension.install)}
                          enabled={server?.enabled}
                          loadState={getLoadStateForExtension?.(extension)}
                          onEnabledChange={
                            server && onEnabledChange
                              ? (enabled) => onEnabledChange(server.id, enabled)
                              : undefined
                          }
                          onInstall={() => onInstallClick(extension)}
                          onUninstall={() => onUninstallClick(extension)}
                          advancedContent={
                            installed && getAdvancedContent
                              ? getAdvancedContent(extension)
                              : undefined
                          }
                          moreInfoJson={
                            installed && getMoreInfoJson ? getMoreInfoJson(extension) : undefined
                          }
                        />
                      );
                    })()
                  ) : (
                    <ExtensionListRow
                      title={item.entry.server.name || "Custom Extension"}
                      description={
                        item.entry.server.type === "stdio"
                          ? item.entry.server.command
                          : item.entry.server.url
                      }
                      installed
                      enabled={item.entry.server.enabled}
                      loadState={item.entry.loadState}
                      onEnabledChange={item.entry.onEnabledChange}
                      onUninstall={item.entry.onUninstall}
                      advancedContent={item.entry.advancedContent}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
