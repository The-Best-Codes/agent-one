import {
  IconAlertTriangle,
  IconCloud,
  IconDeviceDesktop,
  IconEye,
  IconEyeOff,
  IconRosetteDiscountCheck,
  IconSettings,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  createMcpServerFromRegistryInstall,
  getStdioRuntimeCommand,
  type McpRegistryExtension,
  type McpRegistryInstallTemplate,
  type McpRegistrySummary,
  type RegistryInstallField,
} from "@/lib/mcp-registry/install";
import { createInstalledRegistryMetadata } from "@/lib/mcp-registry/metadata";
import { getRegistryExtension } from "@/lib/mcp-registry/storage";
import { isCommandAvailable } from "@/lib/run-command";
import { type McpServerConfig } from "@/lib/settings/types";

import { getExtensionDisplayName, getExtensionPublisher, isVerifiedExtension } from "./curated";
import { ExtensionIcon } from "./extension-listing";

const RUNTIME_NAMES: Record<string, string> = {
  npx: "Node.js",
  node: "Node.js",
  uvx: "uv",
  uv: "uv",
  docker: "Docker",
  podman: "Podman",
  python: "Python",
  python3: "Python",
  bunx: "Bun",
  bun: "Bun",
  dotnet: ".NET",
  dnx: ".NET",
};

function humanizeKey(key: string): string {
  const words = key.replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function getVisibleFields(template: McpRegistryInstallTemplate): RegistryInstallField[] {
  const variableKeys = new Set(
    template.fields.filter((field) => field.kind === "variable").map((field) => field.key),
  );
  return template.fields
    .filter(
      (field) =>
        field.kind === "variable" ||
        !Array.from(field.defaultValue.matchAll(/\{([^}]+)\}/g)).some(([, key]) =>
          variableKeys.has(key),
        ),
    )
    .sort((a, b) => Number(b.required) - Number(a.required));
}

function pickDefaultTemplate(templates: McpRegistryInstallTemplate[]) {
  const requiredCount = (template: McpRegistryInstallTemplate) =>
    template.fields.filter((field) => field.required).length;
  return [...templates].sort(
    (a, b) =>
      requiredCount(a) - requiredCount(b) || Number(b.type === "http") - Number(a.type === "http"),
  )[0];
}

function getHost(url?: string): string | undefined {
  try {
    return url ? new URL(url.replace(/\{[^}]+\}/g, "x")).host : undefined;
  } catch {
    return undefined;
  }
}

function SetupField({
  field,
  value,
  onChange,
}: {
  field: RegistryInstallField;
  value: string;
  onChange: (value: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const label = humanizeKey(field.label);

  return (
    <Field>
      <FieldLabel htmlFor={field.id}>
        {label}
        {field.required ? null : <span className="text-muted-foreground">(optional)</span>}
      </FieldLabel>
      {field.choices?.length ? (
        <Select value={value || field.choices[0]} onValueChange={onChange}>
          <SelectTrigger id={field.id} className="w-full">
            <SelectValue placeholder={label} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {field.choices.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <InputGroup>
          <InputGroupInput
            id={field.id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            type={field.secret && !revealed ? "password" : "text"}
            autoComplete="off"
          />
          {field.secret ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={revealed ? "Hide value" : "Show value"}
                onClick={() => setRevealed((previous) => !previous)}
              >
                {revealed ? <IconEyeOff /> : <IconEye />}
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      )}
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
    </Field>
  );
}

function InstallSteps({
  summary,
  extension,
  onCancel,
  onInstall,
}: {
  summary: McpRegistrySummary;
  extension: McpRegistryExtension;
  onCancel: () => void;
  onInstall: (server: McpServerConfig) => void;
}) {
  const name = getExtensionDisplayName(summary.id, summary.displayName);
  const publisher = getExtensionPublisher(summary.id) ?? "the developer";
  const verified = isVerifiedExtension(summary.id);
  const localTemplate = extension.installTemplates.find((template) => template.type === "stdio");
  const onlineTemplate = extension.installTemplates.find((template) => template.type === "http");

  const [template, setTemplate] = useState(() => pickDefaultTemplate(extension.installTemplates));
  const [step, setStep] = useState<"review" | "setup">("review");
  const [requiresApproval, setRequiresApproval] = useState(!verified);
  const [values, setValues] = useState<Record<string, string>>({});
  const [missingRuntime, setMissingRuntime] = useState<string | null>(null);

  const runtime =
    template.type === "stdio" ? getStdioRuntimeCommand(template.commandTemplate ?? "") : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!runtime) return;
    void isCommandAvailable(runtime).then((available) => {
      if (!cancelled) setMissingRuntime(available ? null : runtime);
    });
    return () => {
      cancelled = true;
      setMissingRuntime(null);
    };
  }, [runtime]);

  const fields = getVisibleFields(template);
  const getValue = (field: RegistryInstallField) => values[field.id] ?? field.defaultValue;
  const isComplete = fields.every((field) => !field.required || getValue(field).trim());

  const install = () => {
    const result = createMcpServerFromRegistryInstall(template, {
      name,
      timeoutSec: 30,
      requiresApproval,
      fieldValues: values,
    });
    if (!result) return;

    const base = {
      id: extension.id,
      name,
      enabled: true,
      timeoutMs: 30_000,
      requiresApproval,
      toolApprovalOverrides: {},
      registryMetadata: createInstalledRegistryMetadata({ ...extension, displayName: name }),
    };
    onInstall(
      result.type === "stdio"
        ? { ...base, type: "stdio", command: result.command, env: result.env }
        : { ...base, type: "http", url: result.url, headers: result.headers },
    );
  };

  if (step === "setup") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Set up {name}</DialogTitle>
          <DialogDescription>
            {name} needs a few details to work. You can change these later in Manage.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4 py-1">
          <FieldGroup>
            {fields.map((field) => (
              <SetupField
                key={field.id}
                field={field}
                value={getValue(field)}
                onChange={(value) => setValues((previous) => ({ ...previous, [field.id]: value }))}
              />
            ))}
          </FieldGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("review")}>
            Back
          </Button>
          <Button disabled={!isComplete} onClick={install}>
            Install
          </Button>
        </DialogFooter>
      </>
    );
  }

  const host = getHost(template.urlTemplate);

  return (
    <>
      <DialogHeader className="flex-row items-center gap-3">
        <ExtensionIcon name={name} iconUrl={summary.iconUrl} className="size-12" />
        <div className="flex min-w-0 flex-col gap-1">
          <DialogTitle>Install {name}?</DialogTitle>
          <DialogDescription className="truncate">by {publisher}</DialogDescription>
        </div>
      </DialogHeader>

      <div className="-mx-4 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-1">
        <p className="text-sm">{extension.description}</p>

        {localTemplate && onlineTemplate ? (
          <ToggleGroup
            type="single"
            variant="outline"
            className="w-full"
            value={template.type}
            onValueChange={(value) => {
              const next =
                value === "stdio" ? localTemplate : value === "http" ? onlineTemplate : null;
              if (next) {
                setTemplate(next);
                setValues({});
              }
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
        ) : null}

        <ItemGroup className="gap-1">
          <Item size="sm">
            <ItemMedia variant="icon">
              {verified ? <IconRosetteDiscountCheck /> : <IconAlertTriangle />}
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {verified ? "Verified by AgentOne" : "Not verified by AgentOne"}
              </ItemTitle>
              <ItemDescription>
                {verified
                  ? "This extension is from a trusted developer and has been checked by AgentOne."
                  : `Anyone can publish extensions. Only install it if you trust ${publisher}.`}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item size="sm">
            <ItemMedia variant="icon">
              {template.type === "stdio" ? <IconDeviceDesktop /> : <IconCloud />}
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {template.type === "stdio"
                  ? "Runs on your device"
                  : "Connects to an online service"}
              </ItemTitle>
              <ItemDescription>
                {template.type === "stdio"
                  ? "It can run programs and access files on your computer."
                  : `Information from your chats may be sent to ${host ?? "the service"}.`}
              </ItemDescription>
            </ItemContent>
          </Item>
          {fields.length > 0 ? (
            <Item size="sm">
              <ItemMedia variant="icon">
                <IconSettings />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Needs a quick setup</ItemTitle>
                <ItemDescription>
                  You'll be asked for some details next, like an account key.
                </ItemDescription>
              </ItemContent>
            </Item>
          ) : null}
          <Item size="sm" asChild>
            <label htmlFor="install-requires-approval">
              <ItemContent>
                <ItemTitle>Ask before it takes actions</ItemTitle>
                <ItemDescription>
                  Approve each action first. You can change this later.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch
                  id="install-requires-approval"
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </ItemActions>
            </label>
          </Item>
        </ItemGroup>

        {missingRuntime ? (
          <Alert variant="destructive">
            <IconAlertTriangle />
            <AlertTitle>
              {RUNTIME_NAMES[missingRuntime] ?? missingRuntime} is not installed
            </AlertTitle>
            <AlertDescription>
              {`This extension needs "${missingRuntime}" to run. You can still install it, but it won't work until that's installed on your device.`}
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {fields.length > 0 ? (
          <Button onClick={() => setStep("setup")}>Continue</Button>
        ) : (
          <Button onClick={install}>Install</Button>
        )}
      </DialogFooter>
    </>
  );
}

function InstallDialogBody({
  summary,
  onCancel,
  onInstall,
}: {
  summary: McpRegistrySummary;
  onCancel: () => void;
  onInstall: (server: McpServerConfig) => void;
}) {
  const [extension, setExtension] = useState<McpRegistryExtension | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getRegistryExtension(summary.id)
      .then((result) => {
        if (!cancelled) setExtension(result?.installTemplates.length ? result : null);
      })
      .catch(() => {
        if (!cancelled) setExtension(null);
      });
    return () => {
      cancelled = true;
    };
  }, [summary.id]);

  if (extension) {
    return (
      <InstallSteps
        summary={summary}
        extension={extension}
        onCancel={onCancel}
        onInstall={onInstall}
      />
    );
  }

  const name = getExtensionDisplayName(summary.id, summary.displayName);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Install {name}?</DialogTitle>
        <DialogDescription>
          {extension === null
            ? "This extension can't be installed right now. Try again after the extension list updates."
            : "Loading extension details..."}
        </DialogDescription>
      </DialogHeader>
      {extension === undefined ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Close
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
}: {
  extension: McpRegistrySummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (server: McpServerConfig) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {extension ? (
          <InstallDialogBody
            key={extension.id}
            summary={extension}
            onCancel={() => onOpenChange(false)}
            onInstall={onInstall}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
