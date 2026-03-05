import { useVirtualizer } from "@tanstack/react-virtual";
import fuzzysort from "fuzzysort";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
} from "@/assets/mcp-registry/mcp-registry";
import { useOverflow } from "@/hooks/use-overflow";
import { cn } from "@/lib/utils";

import { ExtensionListRow } from "./extension-list-row";

const ESTIMATED_EXTENSION_ITEM_HEIGHT = 148;

interface ExtensionsBrowserProps {
  filter?: "all" | "installed";
  query: string;
  isInstalled: (extension: McpRegistryExtension) => boolean;
  onInstallClick: (extension: McpRegistryExtension) => void;
  onUninstallClick: (extension: McpRegistryExtension) => void;
  getAdvancedContent?: (extension: McpRegistryExtension) => ReactNode;
  getMoreInfoJson?: (extension: McpRegistryExtension) => unknown;
}

export function ExtensionsBrowser({
  filter = "all",
  query,
  isInstalled,
  onInstallClick,
  onUninstallClick,
  getAdvancedContent,
  getMoreInfoJson,
}: ExtensionsBrowserProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => getMcpRegistryExtensions(), []);

  const filteredExtensions = useMemo(() => {
    const normalizedQuery = query.trim();

    const baseExtensions =
      filter === "installed"
        ? extensions.filter((extension) => isInstalled(extension))
        : extensions;

    if (!normalizedQuery) {
      return baseExtensions;
    }

    return baseExtensions
      .map((extension) => ({
        extension,
        score:
          fuzzysort.single(
            normalizedQuery,
            [
              extension.displayName,
              extension.registryName,
              extension.searchText,
            ]
              .filter(Boolean)
              .join(" "),
          )?.score ?? 0,
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ extension }) => extension);
  }, [extensions, filter, isInstalled, query]);

  const isOverflowing = useOverflow(parentRef, {
    watch: `${filteredExtensions.length}:${filter}:${query}`,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredExtensions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => filteredExtensions[index]?.id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
    virtualizer.scrollToOffset(0);
  }, [filter, query, virtualizer]);

  return (
    <div
      ref={parentRef}
      className="max-h-96 scroll-py-1 overflow-x-hidden overflow-y-auto"
      aria-label="Extensions"
    >
      {filteredExtensions.length === 0 ? (
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
              const extension = filteredExtensions[virtualItem.index];
              const installed = isInstalled(extension);

              return (
                <div
                  key={extension.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full py-1 first:pt-0 last:pb-0"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ExtensionListRow
                    title={extension.displayName}
                    description={extension.description}
                    version={extension.version}
                    iconUrl={extension.iconUrl}
                    websiteUrl={extension.websiteUrl}
                    badges={
                      extension.categories.length > 0
                        ? extension.categories
                        : extension.tags
                    }
                    installed={installed}
                    installSupported={Boolean(extension.install)}
                    onInstall={() => onInstallClick(extension)}
                    onUninstall={() => onUninstallClick(extension)}
                    advancedContent={
                      installed && getAdvancedContent
                        ? getAdvancedContent(extension)
                        : undefined
                    }
                    moreInfoJson={
                      installed && getMoreInfoJson
                        ? getMoreInfoJson(extension)
                        : undefined
                    }
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
