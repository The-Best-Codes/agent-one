import { IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { type McpServerConfig } from "@/lib/settings/types";

interface DanglingExtensionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpServers: McpServerConfig[];
  knownRegistryNames: Set<string>;
  onRemove: (serverId: string) => void;
  onRemoveAll: (serverIds: string[]) => void;
}

function getRegistryNameFromServerId(serverId: string): string | null {
  const atIdx = serverId.lastIndexOf("@");
  if (atIdx <= 0) return null;
  return serverId.slice(0, atIdx);
}

export function DanglingExtensionsDialog({
  open,
  onOpenChange,
  mcpServers,
  knownRegistryNames,
  onRemove,
  onRemoveAll,
}: DanglingExtensionsDialogProps) {
  const { t } = useTranslation();
  const danglingServers = useMemo(() => {
    return mcpServers.filter((server) => {
      const registryName = getRegistryNameFromServerId(server.id);
      if (!registryName) return false;
      return !knownRegistryNames.has(registryName);
    });
  }, [mcpServers, knownRegistryNames]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("extensions.danglingTitle")}</DialogTitle>
          <DialogDescription>{t("extensions.danglingDescription")}</DialogDescription>
        </DialogHeader>

        {danglingServers.length === 0 ? (
          <div className="text-muted-foreground rounded-md border p-6 text-center text-sm">
            {t("extensions.noDangling")}
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
                    {server.name || t("extensions.unnamed")}
                  </span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {server.id}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t("extensions.removeAria", { name: server.name || server.id })}
                  onClick={() => {
                    trackSettingsInteraction("extensions", "remove_dangling_extension");
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
            {t("common.close")}
          </Button>
          {danglingServers.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                trackSettingsInteraction("extensions", "remove_all_dangling_extensions", {
                  count: danglingServers.length,
                });
                onRemoveAll(danglingServers.map((s) => s.id));
              }}
            >
              {t("extensions.removeAll")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
