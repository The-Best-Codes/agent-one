import type { McpRegistryExtension } from "@/assets/mcp-registry/mcp-registry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UninstallExtensionDialogProps {
  extension: McpRegistryExtension | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UninstallExtensionDialog({
  extension,
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: UninstallExtensionDialogProps) {
  if (!extension) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Uninstall {extension.displayName}</DialogTitle>
          <DialogDescription>
            Are you sure you want to uninstall this extension? Its MCP server
            configuration will be removed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Uninstall
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
