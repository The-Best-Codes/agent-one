import { useVirtualizer } from "@tanstack/react-virtual";
import { SearchIcon, SparklesIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import {
  getMcpRegistryExtensions,
  type McpRegistryExtension,
} from "@/assets/mcp-registry/mcp-registry";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXTENSION_ITEM_HEIGHT = 106;

interface ExtensionsBrowserProps {
  installedRegistryNames: Set<string>;
  onInstallClick: (extension: McpRegistryExtension) => void;
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
}: {
  extension: McpRegistryExtension;
  installed: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="flex h-full items-start justify-between gap-3 border-b px-3 py-3">
      <Avatar className="mt-0.5" size="sm">
        <AvatarImage
          src={extension.iconUrl}
          alt={`${extension.displayName} icon`}
        />
        <AvatarFallback>{getInitials(extension.displayName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {extension.displayName}
          </p>
          <Badge variant="outline">v{extension.version}</Badge>
          {extension.officialStatus === "active" ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              Official
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {extension.description}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-xs">
          {extension.registryName}
        </p>
      </div>
      <Button
        size="sm"
        variant={installed ? "outline" : "default"}
        onClick={onInstall}
        disabled={installed || !extension.install}
      >
        {installed
          ? "Installed"
          : extension.install
            ? "Install"
            : "Unsupported"}
      </Button>
    </div>
  );
}

export function ExtensionsBrowser({
  installedRegistryNames,
  onInstallClick,
}: ExtensionsBrowserProps) {
  const [query, setQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => getMcpRegistryExtensions(), []);

  const filteredExtensions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return extensions;
    }
    return extensions.filter((extension) =>
      extension.searchText.includes(normalizedQuery),
    );
  }, [extensions, query]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredExtensions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => EXTENSION_ITEM_HEIGHT,
    overscan: 6,
  });

  const listHeight = Math.min(
    filteredExtensions.length * EXTENSION_ITEM_HEIGHT,
    420,
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <SparklesIcon className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">Extensions Registry</p>
      </div>

      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search extensions"
          className="pl-9"
        />
      </div>

      {filteredExtensions.length > 0 ? (
        <div
          ref={parentRef}
          className="border-border overflow-y-auto rounded-md border"
          style={{ height: listHeight || EXTENSION_ITEM_HEIGHT }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const extension = filteredExtensions[virtualItem.index];
              const installed = installedRegistryNames.has(
                extension.registryName,
              );

              return (
                <div
                  key={extension.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ExtensionRow
                    extension={extension}
                    installed={installed}
                    onInstall={() => onInstallClick(extension)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-sm">
          No extensions match your search.
        </div>
      )}
    </div>
  );
}
