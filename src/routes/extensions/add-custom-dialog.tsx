import { IconAlertTriangle, IconCloud, IconDeviceDesktop } from "@tabler/icons-react";
import { useState } from "react";

import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type McpServerConfig, type McpServerType } from "@/lib/settings/types";

export interface CustomExtensionPrefill {
  name: string;
  type: McpServerType;
  command?: string;
  url?: string;
}

function AddCustomForm({
  prefill,
  onCancel,
  onAdd,
}: {
  prefill: CustomExtensionPrefill | null;
  onCancel: () => void;
  onAdd: (server: McpServerConfig) => void;
}) {
  const [type, setType] = useState<McpServerType>(prefill?.type ?? "http");
  const [name, setName] = useState(prefill?.name ?? "");
  const [command, setCommand] = useState(prefill?.command ?? "");
  const [url, setUrl] = useState(prefill?.url ?? "");
  const [env, setEnv] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<Record<string, string>>({});

  const isValid = name.trim() !== "" && (type === "stdio" ? command.trim() : url.trim()) !== "";

  const add = () => {
    const base = {
      id: crypto.randomUUID(),
      name: name.trim(),
      enabled: true,
      timeoutMs: 30_000,
      requiresApproval: true,
      toolApprovalOverrides: {},
    };
    onAdd(
      type === "stdio"
        ? { ...base, type, command: command.trim(), env }
        : { ...base, type, url: url.trim(), headers },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a custom extension</DialogTitle>
        <DialogDescription>Connect any MCP server that isn't listed in Explore.</DialogDescription>
      </DialogHeader>

      <div className="-mx-4 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-1">
        {prefill ? (
          <Alert variant="destructive">
            <IconAlertTriangle />
            <AlertTitle>These details were filled in by a link</AlertTitle>
            <AlertDescription>
              Check them carefully before adding. Only add extensions you trust.
            </AlertDescription>
          </Alert>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel>Where it runs</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              className="w-full"
              value={type}
              onValueChange={(value) => {
                if (value) setType(value as McpServerType);
              }}
            >
              <ToggleGroupItem value="http" className="flex-1">
                <IconCloud />
                Online
              </ToggleGroupItem>
              <ToggleGroupItem value="stdio" className="flex-1">
                <IconDeviceDesktop />
                On this device
              </ToggleGroupItem>
            </ToggleGroup>
            <FieldDescription>
              {type === "stdio"
                ? "Runs a program on your computer. It can access your files, so only use commands you trust."
                : "Connects to an MCP server on the internet using its URL."}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="custom-extension-name">Name</FieldLabel>
            <Input
              id="custom-extension-name"
              placeholder="My extension"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          {type === "stdio" ? (
            <>
              <Field>
                <FieldLabel htmlFor="custom-extension-command">Command</FieldLabel>
                <Input
                  id="custom-extension-command"
                  placeholder="npx -y @modelcontextprotocol/server-everything"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                />
              </Field>
              <EnvVarsEditor id="custom-extension" env={env} onChange={setEnv} />
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="custom-extension-url">URL</FieldLabel>
                <Input
                  id="custom-extension-url"
                  placeholder="https://mcp.example.com/mcp"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
              </Field>
              <HttpHeadersEditor id="custom-extension" headers={headers} onChange={setHeaders} />
            </>
          )}
        </FieldGroup>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!isValid} onClick={add}>
          Add extension
        </Button>
      </DialogFooter>
    </>
  );
}

export function AddCustomDialog({
  open,
  prefill,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  prefill: CustomExtensionPrefill | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (server: McpServerConfig) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AddCustomForm prefill={prefill} onCancel={() => onOpenChange(false)} onAdd={onAdd} />
      </DialogContent>
    </Dialog>
  );
}
