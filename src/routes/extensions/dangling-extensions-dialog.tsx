import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getInstalledRegistryName } from "@/lib/mcp-registry/metadata";
import { type McpServerConfig } from "@/lib/settings/types";

interface DanglingExtensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpServers: McpServerConfig[];
  knownRegistryNames: Set<string>;
  registryReady: boolean;
  onRemove: (serverId: string) => void;
  onRemoveAll: (serverIds: string[]) => void;
}

export function DanglingExtensionsDialog({
  open,
  onOpenChange,
  mcpServers,
  knownRegistryNames,
  registryReady,
  onRemove,
  onRemoveAll,
}: DanglingExtensionsDialogProps) {
  const danglingServers = useMemo(() => {
    if (!registryReady) return [];
    return mcpServers.filter((server) => {
      const registryName = getInstalledRegistryName(server);
      if (!registryName) return false;
      return !knownRegistryNames.has(registryName);
    });
  }, [mcpServers, knownRegistryNames, registryReady]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dangling extensions</DialogTitle>
          <DialogDescription>
            These extensions were installed previously but no longer match anything in the registry,
            usually because the extension was updated to a newer version. They may still be running
            in the background.
          </DialogDescription>
        </DialogHeader>

        {danglingServers.length === 0 ? (
          <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">
            {registryReady
              ? "No dangling extensions found."
              : "Wait for the extension list to finish loading before checking for dangling extensions."}
          </div>
        ) : (
          <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {danglingServers.map((server) => (
              <li
                key={server.id}
                className="flex items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {server.name || "Unnamed extension"}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {server.id}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`Remove ${server.name || server.id}`}
                  onClick={() => {
                    onRemove(server.id);
                  }}
                >
                  <IconTrash />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {danglingServers.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                onRemoveAll(danglingServers.map((s) => s.id));
              }}
            >
              Remove all
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
