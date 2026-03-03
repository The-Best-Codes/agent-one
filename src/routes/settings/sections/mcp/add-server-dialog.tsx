import { useState } from "react";

import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type McpServerType } from "@/lib/settings/types";

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

export function AddServerDialog({
  open,
  onOpenChange,
  onAddServer,
}: AddServerDialogProps) {
  const [newServerType, setNewServerType] = useState<McpServerType>("stdio");
  const [newServerName, setNewServerName] = useState("");
  const [newServerCommand, setNewServerCommand] = useState("");
  const [newServerEnv, setNewServerEnv] = useState<Record<string, string>>({});
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerHeaders, setNewServerHeaders] = useState<
    Record<string, string>
  >({});
  const [newServerTimeoutSec, setNewServerTimeoutSec] = useState(30);
  const [newServerRequiresApproval, setNewServerRequiresApproval] =
    useState(false);

  const isAddFormValid =
    newServerName.trim() !== "" &&
    newServerTimeoutSec >= 0.1 &&
    (newServerType === "stdio"
      ? newServerCommand.trim() !== ""
      : newServerUrl.trim() !== "");

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
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Extension</DialogTitle>
          <DialogDescription>
            Configure a custom extension by defining an MCP server.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="server-type">Server Type</Label>
            <Select
              value={newServerType}
              onValueChange={(value: McpServerType) => setNewServerType(value)}
            >
              <SelectTrigger id="server-type">
                <SelectValue placeholder="Select server type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stdio">STDIO (Local)</SelectItem>
                <SelectItem value="http">HTTP (Remote)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {newServerType === "stdio"
                ? "STDIO servers run locally via command line."
                : "HTTP servers are remote endpoints that support the MCP protocol."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="server-name">Name</Label>
            <Input
              id="server-name"
              placeholder="e.g., Everything Server"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
            />
          </div>

          {newServerType === "stdio" ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="server-command">Command</Label>
                <Input
                  id="server-command"
                  placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                  value={newServerCommand}
                  onChange={(e) => setNewServerCommand(e.target.value)}
                />
              </div>

              <EnvVarsEditor
                id="new-server-dialog"
                env={newServerEnv}
                onChange={setNewServerEnv}
                labelClassName="text-sm"
              />
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="server-url">URL</Label>
                <Input
                  id="server-url"
                  placeholder="https://mcp.example.com/api"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                />
              </div>

              <HttpHeadersEditor
                id="new-server-dialog"
                headers={newServerHeaders}
                onChange={setNewServerHeaders}
                labelClassName="text-sm"
              />
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="server-timeout">Timeout (seconds)</Label>
            <Input
              id="server-timeout"
              type="number"
              min="0.1"
              max="300"
              step="0.1"
              value={newServerTimeoutSec}
              onChange={(e) =>
                setNewServerTimeoutSec(parseFloat(e.target.value))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="server-approval" className="text-sm">
                Require Approval
              </Label>
              <span className="text-muted-foreground text-xs">
                Ask for confirmation before running tools from this server
              </span>
            </div>
            <Switch
              id="server-approval"
              checked={newServerRequiresApproval}
              onCheckedChange={setNewServerRequiresApproval}
            />
          </div>
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
