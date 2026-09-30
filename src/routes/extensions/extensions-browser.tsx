import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

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
  transportType: "stdio" | "http";
  transportTypes?: ("stdio" | "http")[];
  installed: boolean;
  canUninstall: boolean;
  installSupported: boolean;
  installLoading?: boolean;
  installDisabled?: boolean;
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
  hasMore: boolean;
  isSearching: boolean;
  resetKey: string;
}

export function ExtensionsBrowser({
  items,
  query,
  hasMore,
  isSearching,
  resetKey,
}: ExtensionsBrowserProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const isOverflowing = useOverflow(parentRef, {
    watch: `${items.length}:${query}`,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => items[index]?.id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
    virtualizer.scrollToOffset(0);
  }, [resetKey, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="max-h-none min-h-0 flex-1 scroll-py-1 overflow-x-hidden overflow-y-auto"
      aria-label="Extensions"
      aria-busy={isSearching}
    >
      {items.length === 0 ? (
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
              const item = items[virtualItem.index];

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
                    installLoading={item.installLoading}
                    installDisabled={item.installDisabled}
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
          {hasMore ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {query.trim()
                ? "Showing the first 100 catalog results alongside installed extensions. Refine your search to discover more."
                : "Showing the first 100 catalog extensions alongside installed extensions. Search to discover more."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
