import { useVirtualizer } from "@tanstack/react-virtual";
import fuzzysort from "fuzzysort";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import { useOverflow } from "@/hooks/use-overflow";
import { type McpAuthState, type McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import { cn } from "@/lib/utils";

import { ExtensionListRow } from "./extension-list-row";

const ESTIMATED_EXTENSION_ITEM_HEIGHT = 148;

export interface ExtensionListItem {
  id: string;
  title: string;
  description: string;
  searchText: string;
  transportType: "stdio" | "http" | "built-in";
  installed: boolean;
  canUninstall: boolean;
  installSupported: boolean;
  version?: string;
  iconUrl?: string;
  websiteUrl?: string;
  badges?: string[];
  enabled?: boolean;
  loadState?: McpServerLoadState;
  authState?: McpAuthState;
  onInstall?: () => void;
  onUninstall?: () => void;
  onEnabledChange?: (enabled: boolean) => void;
  onRestart?: () => void;
  advancedContent?: ReactNode;
  advancedContentKey?: unknown;
  moreInfoJson?: unknown;
}

interface ExtensionsBrowserProps {
  items: ExtensionListItem[];
  query: string;
  onlyInstalled: boolean;
  showDeviceExtensions: boolean;
  showOnlineExtensions: boolean;
}

export function ExtensionsBrowser({
  items,
  query,
  onlyInstalled,
  showDeviceExtensions,
  showOnlineExtensions,
}: ExtensionsBrowserProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    let result = items;

    if (onlyInstalled) {
      result = result.filter((item) => item.installed);
    }

    result = result.filter((item) => {
      if (item.transportType === "built-in") return true;
      if (item.transportType === "stdio") return showDeviceExtensions;
      if (item.transportType === "http") return showOnlineExtensions;
      return showDeviceExtensions || showOnlineExtensions;
    });

    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      result = result
        .map((item) => ({
          item,
          score: fuzzysort.single(normalizedQuery, item.searchText)?.score ?? 0,
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    } else {
      result = [...result].sort((a, b) => {
        const rank = (item: ExtensionListItem) => {
          if (item.transportType === "built-in") return 0;
          if (item.installed) return 1;
          return 2;
        };
        return rank(a) - rank(b);
      });
    }

    return result;
  }, [items, onlyInstalled, query, showDeviceExtensions, showOnlineExtensions]);

  const isOverflowing = useOverflow(parentRef, {
    watch: `${filteredItems.length}:${onlyInstalled}:${query}`,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => filteredItems[index]?.id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
    virtualizer.scrollToOffset(0);
  }, [onlyInstalled, query, showDeviceExtensions, showOnlineExtensions, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="max-h-none min-h-0 flex-1 scroll-py-1 overflow-x-hidden overflow-y-auto"
      aria-label="Extensions"
    >
      {filteredItems.length === 0 ? (
        <div className="text-muted-foreground rounded-md p-8 text-center text-sm">
          No extensions match your search.
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
                  key={item.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full py-1 first:pt-0 last:pb-0"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ExtensionListRow
                    title={item.title}
                    description={item.description}
                    version={item.version}
                    iconUrl={item.iconUrl}
                    websiteUrl={item.websiteUrl}
                    badges={item.badges}
                    installed={item.installed}
                    installSupported={item.installSupported}
                    canUninstall={item.canUninstall}
                    enabled={item.enabled}
                    loadState={item.loadState}
                    authState={item.authState}
                    onInstall={item.onInstall}
                    onUninstall={item.onUninstall}
                    onEnabledChange={item.onEnabledChange}
                    onRestart={item.onRestart}
                    advancedContent={item.advancedContent}
                    advancedContentKey={item.advancedContentKey}
                    moreInfoJson={item.moreInfoJson}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
