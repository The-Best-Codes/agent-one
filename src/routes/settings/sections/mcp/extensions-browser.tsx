import { useVirtualizer } from "@tanstack/react-virtual";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
} from "@/assets/mcp-registry/mcp-registry";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { commandScore } from "@/lib/command-score";

import { ExtensionListRow } from "./extension-list-row";

const ESTIMATED_EXTENSION_ITEM_HEIGHT = 148;

interface ExtensionsBrowserProps {
  filter?: "all" | "installed";
  isInstalled: (extension: McpRegistryExtension) => boolean;
  onInstallClick: (extension: McpRegistryExtension) => void;
  onUninstallClick: (extension: McpRegistryExtension) => void;
  getAdvancedContent?: (extension: McpRegistryExtension) => ReactNode;
  getMoreInfoContent?: (extension: McpRegistryExtension) => ReactNode;
}

export function ExtensionsBrowser({
  filter = "all",
  isInstalled,
  onInstallClick,
  onUninstallClick,
  getAdvancedContent,
  getMoreInfoContent,
}: ExtensionsBrowserProps) {
  const [query, setQuery] = useState("");
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
        score: commandScore(extension.displayName, normalizedQuery, [
          extension.registryName,
          extension.searchText,
        ]),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ extension }) => extension);
  }, [extensions, filter, isInstalled, query]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredExtensions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => filteredExtensions[index]?.id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  return (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search extensions..."
      />
      <CommandList
        ref={parentRef}
        className="h-[60vh] max-h-[52rem] min-h-[26rem] rounded-none border-0"
      >
        {filteredExtensions.length === 0 ? (
          <CommandEmpty className="h-full py-3">
            <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
              {filter === "installed"
                ? "No installed extensions match your search."
                : "No extensions match your search."}
            </div>
          </CommandEmpty>
        ) : (
          <CommandGroup className="p-2">
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
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="py-1">
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
                        moreInfoContent={
                          installed && getMoreInfoContent
                            ? getMoreInfoContent(extension)
                            : undefined
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
