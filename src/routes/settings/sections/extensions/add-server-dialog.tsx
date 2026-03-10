import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type McpServerType } from "@/lib/settings/types";

import { McpServerConfigForm } from "./mcp-server-config-form";
import { isMcpServerConfigFormValid } from "./mcp-server-config-form-utils";

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddServer: (serverData: {
    type: McpServerType;
    name: string;
    command?: string;
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    timeoutSec: number;
    requiresApproval: boolean;
  }) => void;
}

export function AddServerDialog({ open, onOpenChange, onAddServer }: AddServerDialogProps) {
  const [newServerType, setNewServerType] = useState<McpServerType>("stdio");
  const [newServerName, setNewServerName] = useState("");
  const [newServerCommand, setNewServerCommand] = useState("");
  const [newServerEnv, setNewServerEnv] = useState<Record<string, string>>({});
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerHeaders, setNewServerHeaders] = useState<Record<string, string>>({});
  const [newServerTimeoutSec, setNewServerTimeoutSec] = useState(30);
  const [newServerRequiresApproval, setNewServerRequiresApproval] = useState(false);

  const isAddFormValid = isMcpServerConfigFormValid({
    type: newServerType,
    name: newServerName,
    command: newServerCommand,
    url: newServerUrl,
    timeoutSec: newServerTimeoutSec,
  });

  const resetAddForm = () => {
    setNewServerType("stdio");
    setNewServerName("");
    setNewServerCommand("");
    setNewServerEnv({});
    setNewServerUrl("");
    setNewServerHeaders({});
    setNewServerTimeoutSec(30);
    setNewServerRequiresApproval(false);
  };

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    onAddServer({
      type: newServerType,
      name: newServerName.trim(),
      command: newServerType === "stdio" ? newServerCommand.trim() : undefined,
      env: newServerType === "stdio" ? newServerEnv : undefined,
      url: newServerType === "http" ? newServerUrl.trim() : undefined,
      headers: newServerType === "http" ? newServerHeaders : undefined,
      timeoutSec: newServerTimeoutSec,
      requiresApproval: newServerRequiresApproval,
    });

    resetAddForm();
    onOpenChange(false);
  };

  const handleCancelAdd = () => {
    resetAddForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Extension</DialogTitle>
          <DialogDescription>
            Configure a custom extension by defining an MCP server.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          <McpServerConfigForm
            idPrefix="new-server-dialog"
            className="grid gap-4 py-4"
            showTypeSelector
            values={{
              type: newServerType,
              name: newServerName,
              command: newServerCommand,
              env: newServerEnv,
              url: newServerUrl,
              headers: newServerHeaders,
              timeoutSec: newServerTimeoutSec,
              requiresApproval: newServerRequiresApproval,
            }}
            onChange={(updates) => {
              if (updates.type !== undefined) {
                setNewServerType(updates.type);
              }
              if (updates.name !== undefined) {
                setNewServerName(updates.name);
              }
              if (updates.command !== undefined) {
                setNewServerCommand(updates.command);
              }
              if (updates.env !== undefined) {
                setNewServerEnv(updates.env);
              }
              if (updates.url !== undefined) {
                setNewServerUrl(updates.url);
              }
              if (updates.headers !== undefined) {
                setNewServerHeaders(updates.headers);
              }
              if (updates.timeoutSec !== undefined) {
                setNewServerTimeoutSec(updates.timeoutSec);
              }
              if (updates.requiresApproval !== undefined) {
                setNewServerRequiresApproval(updates.requiresApproval);
              }
            }}
            namePlaceholder="e.g., Everything Server"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelAdd}>
            Cancel
          </Button>
          <Button onClick={handleAddServer} disabled={!isAddFormValid}>
            Add Custom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
