import { useVirtualizer } from "@tanstack/react-virtual";
import { ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
} from "@/assets/mcp-registry/mcp-registry";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { commandScore } from "@/lib/command-score";

const ESTIMATED_EXTENSION_ITEM_HEIGHT = 148;

interface ExtensionsBrowserProps {
  isInstalled: (extension: McpRegistryExtension) => boolean;
  onInstallClick: (extension: McpRegistryExtension) => void;
  onUninstallClick: (extension: McpRegistryExtension) => void;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "EX";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function ExtensionRow({
  extension,
  installed,
  onInstall,
  onUninstall,
}: {
  extension: McpRegistryExtension;
  installed: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  return (
    <div className="flex w-full items-start gap-4 rounded-md border p-4">
      <Avatar size="sm">
        <AvatarImage
          src={extension.iconUrl}
          alt={`${extension.displayName} icon`}
        />
        <AvatarFallback>{getInitials(extension.displayName)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium">
            {extension.displayName}
          </p>
          <Badge variant="outline">v{extension.version}</Badge>
          {!extension.publisher ? (
            <Badge variant="secondary">Community</Badge>
          ) : null}
        </div>

        <p className="text-muted-foreground line-clamp-2 text-xs">
          {extension.description}
        </p>

        <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
          {extension.publisher ? (
            <span className="truncate">by {extension.publisher}</span>
          ) : null}
          {(extension.categories.length > 0
            ? extension.categories
            : extension.tags
          )
            .slice(0, 2)
            .map((tag) => (
              <Badge key={`${extension.id}-${tag}`} variant="outline">
                {tag}
              </Badge>
            ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {extension.websiteUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={extension.websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon className="size-4" />
              Website
            </a>
          </Button>
        ) : null}

        {installed ? (
          <Button size="sm" variant="destructive" onClick={onUninstall}>
            <Trash2Icon className="size-4" />
            Uninstall
          </Button>
        ) : (
          <Button
            size="sm"
            variant="default"
            onClick={onInstall}
            disabled={!extension.install}
          >
            {extension.install ? "Install" : "Unsupported"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ExtensionsBrowser({
  isInstalled,
  onInstallClick,
  onUninstallClick,
}: ExtensionsBrowserProps) {
  const [query, setQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => getMcpRegistryExtensions(), []);

  const filteredExtensions = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return extensions;
    }

    return extensions
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
  }, [extensions, query]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredExtensions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_EXTENSION_ITEM_HEIGHT,
    getItemKey: (index) => filteredExtensions[index]?.id ?? index,
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 6,
  });

  const totalSize = virtualizer.getTotalSize();
  const listHeight = Math.min(
    totalSize || ESTIMATED_EXTENSION_ITEM_HEIGHT,
    420,
  );

  return (
    <Command
      shouldFilter={false}
      className="border-border rounded-md border bg-transparent"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search extensions..."
      />
      <CommandList
        ref={parentRef}
        className="rounded-none border-0"
        style={{ height: listHeight }}
      >
        {filteredExtensions.length === 0 ? (
          <CommandEmpty className="flex h-full items-center justify-center py-0 text-center">
            No extensions match your search.
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
                      <ExtensionRow
                        extension={extension}
                        installed={installed}
                        onInstall={() => onInstallClick(extension)}
                        onUninstall={() => onUninstallClick(extension)}
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
