import { PlusIcon, Trash2Icon } from "lucide-react";
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

interface HeaderEntry {
  key: string;
  value: string;
}

interface AddServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddServer: (serverData: {
    type: McpServerType;
    name: string;
    command?: string;
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
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerHeaders, setNewServerHeaders] = useState<HeaderEntry[]>([]);
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
    setNewServerUrl("");
    setNewServerHeaders([]);
    setNewServerTimeoutSec(30);
    setNewServerRequiresApproval(false);
  };

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    const headers: Record<string, string> = {};
    for (const entry of newServerHeaders) {
      if (entry.key.trim() && entry.value.trim()) {
        headers[entry.key.trim()] = entry.value.trim();
      }
    }

    onAddServer({
      type: newServerType,
      name: newServerName.trim(),
      command: newServerType === "stdio" ? newServerCommand.trim() : undefined,
      url: newServerType === "http" ? newServerUrl.trim() : undefined,
      headers: newServerType === "http" ? headers : undefined,
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

  const addHeaderEntry = () => {
    setNewServerHeaders((prev) => [...prev, { key: "", value: "" }]);
  };

  const updateHeaderEntry = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setNewServerHeaders((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const removeHeaderEntry = (index: number) => {
    setNewServerHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
          <DialogDescription>
            Configure a new MCP server to extend the AI&apos;s capabilities.
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
            <div className="grid gap-2">
              <Label htmlFor="server-command">Command</Label>
              <Input
                id="server-command"
                placeholder="e.g., npx -y @modelcontextprotocol/server-everything"
                value={newServerCommand}
                onChange={(e) => setNewServerCommand(e.target.value)}
              />
            </div>
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

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>HTTP Headers</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHeaderEntry}
                  >
                    <PlusIcon className="size-4" />
                    Add Header
                  </Button>
                </div>
                {newServerHeaders.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {newServerHeaders.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Header name"
                          value={entry.key}
                          onChange={(e) =>
                            updateHeaderEntry(idx, "key", e.target.value)
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value"
                          value={entry.value}
                          onChange={(e) =>
                            updateHeaderEntry(idx, "value", e.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeHeaderEntry(idx)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No headers configured. Add headers for authentication or
                    other purposes.
                  </p>
                )}
              </div>
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
            Add Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
