import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  createMcpServerFromRegistryInstall,
  type McpRegistryExtension,
  type McpRegistryInstallResult,
  type RegistryInstallField,
} from "@/assets/mcp-registry/mcp-registry";
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

import { McpServerConfigForm } from "./mcp-server-config-form";
import { isMcpServerConfigFormValid } from "./mcp-server-config-form-utils";

interface InstallExtensionDialogProps {
  extension: McpRegistryExtension | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (server: McpRegistryInstallResult) => void;
}

function InstallFieldInput({
  field,
  value,
  onChange,
}: {
  field: RegistryInstallField;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.id} className="text-xs">
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder || undefined}
          type={field.secret && !showSecret ? "password" : "text"}
        />
        {field.secret ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowSecret((prev) => !prev)}
            title={showSecret ? "Hide value" : "Show value"}
          >
            {showSecret ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </Button>
        ) : null}
      </div>
      {field.description ? (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      ) : null}
    </div>
  );
}

function InstallExtensionDialogBody({
  extension,
  onOpenChange,
  onInstall,
}: {
  extension: McpRegistryExtension;
  onOpenChange: (open: boolean) => void;
  onInstall: (server: McpRegistryInstallResult) => void;
}) {
  const install = extension.install;
  const defaultFieldValues = useMemo(() => {
    if (!install) {
      return {};
    }

    return install.fields.reduce<Record<string, string>>((accumulator, field) => {
      accumulator[field.id] = field.defaultValue;
      return accumulator;
    }, {});
  }, [install]);

  const [name, setName] = useState(extension.displayName);
  const [timeoutSec, setTimeoutSec] = useState(30);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [command, setCommand] = useState(install?.commandTemplate || "");
  const [url, setUrl] = useState(install?.urlTemplate || "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(defaultFieldValues);

  if (!install) {
    return null;
  }

  const requiredFields = install.fields.filter((field) => field.required);
  const detectedConfigurationContent =
    install.fields.length > 0 ? (
      <div className="rounded-md border p-3">
        <p className="mb-3 text-xs font-medium">Detected configuration</p>
        <div className="flex flex-col gap-3">
          {install.fields.map((field) => (
            <InstallFieldInput
              key={field.id}
              field={field}
              value={fieldValues[field.id] || ""}
              onChange={(value) => setFieldValues((prev) => ({ ...prev, [field.id]: value }))}
            />
          ))}
        </div>
      </div>
    ) : null;

  const isFormValid =
    isMcpServerConfigFormValid({
      type: install.type,
      name,
      command,
      url,
      timeoutSec,
    }) && requiredFields.every((field) => (fieldValues[field.id] || "").trim() !== "");

  const handleInstall = () => {
    if (!isFormValid) {
      return;
    }

    const result = createMcpServerFromRegistryInstall(extension, {
      name: name.trim(),
      timeoutSec,
      requiresApproval,
      fieldValues,
      command: install.type === "stdio" ? command : undefined,
      url: install.type === "http" ? url : undefined,
    });

    if (!result) {
      return;
    }

    onInstall(result);
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Install {extension.displayName}</DialogTitle>
        <DialogDescription>
          Review detected settings and install this MCP extension.
        </DialogDescription>
      </DialogHeader>

      <McpServerConfigForm
        idPrefix="install-extension"
        className="grid gap-4 py-2"
        values={{
          type: install.type,
          name,
          command,
          env: {},
          url,
          headers: {},
          timeoutSec,
          requiresApproval,
        }}
        onChange={(updates) => {
          if (updates.name !== undefined) {
            setName(updates.name);
          }
          if (updates.command !== undefined) {
            setCommand(updates.command);
          }
          if (updates.url !== undefined) {
            setUrl(updates.url);
          }
          if (updates.timeoutSec !== undefined) {
            setTimeoutSec(updates.timeoutSec);
          }
          if (updates.requiresApproval !== undefined) {
            setRequiresApproval(updates.requiresApproval);
          }
        }}
        showTransportEditors={false}
        commandPlaceholder="npx -y ..."
        urlPlaceholder="https://..."
        approvalDescription="Ask before running tools from this extension"
        stdioSupplement={detectedConfigurationContent}
        httpSupplement={detectedConfigurationContent}
      />

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleInstall} disabled={!isFormValid}>
          Install
        </Button>
      </DialogFooter>
    </>
  );
}

export function InstallExtensionDialog({
  extension,
  open,
  onOpenChange,
  onInstall,
}: InstallExtensionDialogProps) {
  if (!extension) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <InstallExtensionDialogBody
          key={`${extension.id}-${open ? "open" : "closed"}`}
          extension={extension}
          onOpenChange={onOpenChange}
          onInstall={onInstall}
        />
      </DialogContent>
    </Dialog>
  );
}
