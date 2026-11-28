import { IconAlertTriangle, IconFolderOpen, IconInfoCircle } from "@tabler/icons-react";
import { open } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import { useEffect, useState } from "react";

import { SecretInput } from "@/components/a1/input/secret-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CommandShell,
  createServerFromInstall,
  getCommandPlaceholderKeys,
  getCommandValueError,
  getStdioRuntimeCommand,
  type ExtensionInstallResult,
  type ExtensionInstallTemplate,
  type ExtensionInstallField,
} from "@/lib/extensions/install";
import { isCommandAvailable } from "@/lib/run-command";

import { McpServerConfigForm, type McpServerConfigFormValues } from "../mcp-server-config-form";

const COMMAND_SHELL: CommandShell = platform() === "windows" ? "cmd" : "posix";

function getFieldError(
  field: ExtensionInstallField,
  value: string,
  inCommand: boolean,
): string | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const lines = field.multiple ? text.split("\n") : [text];
  const commandError = inCommand
    ? lines.map((line) => getCommandValueError(line.trim(), COMMAND_SHELL)).find(Boolean)
    : undefined;
  if (commandError) return commandError;
  if (!field.pattern) return undefined;
  try {
    return new RegExp(field.pattern).test(text)
      ? undefined
      : "This doesn't look like a valid address for this extension.";
  } catch {
    return undefined;
  }
}

function InstallField({
  field,
  value,
  inCommand,
  onChange,
}: {
  field: ExtensionInstallField;
  value: string;
  inCommand: boolean;
  onChange: (value: string) => void;
}) {
  const options: NonNullable<ExtensionInstallField["options"]> | undefined =
    field.options ?? field.choices?.map((choice) => ({ value: choice, label: choice }));
  const error = getFieldError(field, value, inCommand);
  const description =
    options?.find((option) => option.value === value)?.description ?? field.description;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={field.id}>
        {field.label}
        {field.required ? <span className="text-muted-foreground">(required)</span> : null}
      </FieldLabel>
      {options?.length ? (
        <Select value={value || options[0].value} onValueChange={onChange}>
          <SelectTrigger id={field.id} className="w-full" aria-invalid={Boolean(error)}>
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : field.secret ? (
        <SecretInput
          id={field.id}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder ?? ""}
          aria-invalid={Boolean(error)}
        />
      ) : field.picker && field.multiple ? (
        <InputGroup>
          <InputGroupTextarea
            id={field.id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder ?? "One per line"}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              onClick={() =>
                void open({ directory: field.picker === "directory", multiple: true }).then(
                  (selected) => {
                    if (!selected?.length) return;
                    onChange([value.trim(), ...selected].filter(Boolean).join("\n"));
                  },
                )
              }
            >
              <IconFolderOpen />
              Add
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : field.picker ? (
        <InputGroup>
          <InputGroupInput
            id={field.id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={field.placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              onClick={() =>
                void open({ directory: field.picker === "directory" }).then((selected) => {
                  if (typeof selected === "string") onChange(selected);
                })
              }
            >
              <IconFolderOpen />
              Browse
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <Input
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
        />
      )}
      {error ? <FieldError>{error}</FieldError> : null}
      {description || field.helpUrl ? (
        <FieldDescription className="wrap-anywhere">
          {description}
          {description && field.helpUrl ? " " : null}
          {field.helpUrl ? (
            <a href={field.helpUrl} target="_blank" rel="noopener noreferrer">
              Where do I find this?
            </a>
          ) : null}
        </FieldDescription>
      ) : null}
    </Field>
  );
}

export interface InstallOAuthClient {
  clientId: string;
  clientSecret: string;
}

export interface InstallInitialValues {
  name?: string;
  timeoutSec?: number;
  requiresApproval?: boolean;
  fieldValues?: Record<string, string>;
}

function getDefaults(
  template: ExtensionInstallTemplate,
  name: string,
  initial?: InstallInitialValues,
): { form: McpServerConfigFormValues; fields: Record<string, string> } {
  return {
    form: {
      type: template.type,
      name: initial?.name ?? name,
      command: template.commandTemplate ?? "",
      env: {},
      url: template.urlTemplate ?? "",
      headers: {},
      timeoutSec: initial?.timeoutSec ?? 30,
      requiresApproval: initial?.requiresApproval ?? true,
    },
    fields: Object.fromEntries(
      template.fields.map((field) => [
        field.id,
        initial?.fieldValues?.[field.id] ??
          (field.defaultValue || (field.options?.[0]?.value ?? field.choices?.[0] ?? "")),
      ]),
    ),
  };
}

function InstallDialogBody({
  name,
  templates,
  notes,
  signInAfterInstall,
  untrusted,
  initialValues,
  oauthClient,
  onClose,
  onInstall,
}: {
  name: string;
  templates: ExtensionInstallTemplate[];
  notes: string[];
  signInAfterInstall: boolean;
  untrusted: boolean;
  initialValues?: InstallInitialValues;
  oauthClient?: { helpUrl?: string };
  onClose: () => void;
  onInstall: (
    server: ExtensionInstallResult,
    template: ExtensionInstallTemplate,
    oauthClient?: InstallOAuthClient,
    fieldValues?: Record<string, string>,
  ) => void;
}) {
  const [templateId, setTemplateId] = useState(templates[0].id);
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const [formValues, setFormValues] = useState(
    () => getDefaults(templates[0], name, initialValues).form,
  );
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => getDefaults(templates[0], name, initialValues).fields,
  );
  const [runtimeCheck, setRuntimeCheck] = useState<{ command: string; available: boolean }>();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [trusted, setTrusted] = useState(false);
  const needsOAuthClient = Boolean(oauthClient) && template.type === "http";

  const selectTemplate = (id: string) => {
    const next = templates.find((item) => item.id === id);
    if (!next) return;
    const defaults = getDefaults(next, formValues.name || name);
    setTemplateId(next.id);
    setFormValues(defaults.form);
    setFieldValues(defaults.fields);
  };

  const runtimeCommand =
    template.type === "stdio" ? getStdioRuntimeCommand(formValues.command) : undefined;
  const commandKeys =
    template.type === "stdio" ? getCommandPlaceholderKeys(formValues.command) : new Set<string>();
  const isInCommand = (field: ExtensionInstallField) => commandKeys.has(field.key);
  const missingRuntime =
    runtimeCheck && runtimeCheck.command === runtimeCommand && !runtimeCheck.available
      ? runtimeCheck.command
      : undefined;

  useEffect(() => {
    if (!runtimeCommand) return;
    let cancelled = false;
    void isCommandAvailable(runtimeCommand).then((available) => {
      if (!cancelled) setRuntimeCheck({ command: runtimeCommand, available });
    });
    return () => {
      cancelled = true;
    };
  }, [runtimeCommand]);

  const isValid =
    formValues.name.trim() !== "" &&
    Number.isFinite(formValues.timeoutSec) &&
    formValues.timeoutSec >= 0.1 &&
    (template.type === "stdio" ? formValues.command.trim() !== "" : formValues.url.trim() !== "") &&
    (!needsOAuthClient || clientId.trim() !== "") &&
    (!untrusted || trusted) &&
    template.fields.every((field) => {
      const value = fieldValues[field.id] ?? "";
      return (
        (!field.required || value.trim() !== "") && !getFieldError(field, value, isInCommand(field))
      );
    });

  const install = () => {
    if (!isValid) return;
    const result = createServerFromInstall(
      template,
      {
        name: formValues.name.trim(),
        timeoutSec: formValues.timeoutSec,
        requiresApproval: formValues.requiresApproval,
        fieldValues,
        command: template.type === "stdio" ? formValues.command : undefined,
        url: template.type === "http" ? formValues.url : undefined,
      },
      COMMAND_SHELL,
    );
    if (!result) return;
    onInstall(
      result,
      template,
      needsOAuthClient
        ? { clientId: clientId.trim(), clientSecret: clientSecret.trim() }
        : undefined,
      Object.fromEntries(template.fields.map((field) => [field.id, fieldValues[field.id] ?? ""])),
    );
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{`Install ${name}`}</DialogTitle>
        <DialogDescription>
          {template.type === "stdio"
            ? "This extension runs on your device."
            : signInAfterInstall
              ? "This extension connects online. You'll be asked to sign in after it's installed."
              : "This extension connects online."}
        </DialogDescription>
      </DialogHeader>

      <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
        <FieldGroup className="py-1">
          {notes.map((note) => (
            <Alert key={note}>
              <IconInfoCircle />
              <AlertDescription>{note}</AlertDescription>
            </Alert>
          ))}

          {templates.length > 1 ? (
            <Field>
              <FieldLabel htmlFor="install-method">Install method</FieldLabel>
              <Select value={template.id} onValueChange={selectTemplate}>
                <SelectTrigger id="install-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {templates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {untrusted ? (
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertTitle>Only install this if you trust where it came from</AlertTitle>
              <AlertDescription>
                This extension isn't from the AgentOne extensions page. It can run any program and
                read or change any file on your device. If a website, message, or someone you don't
                know told you to open it, don't install it.
              </AlertDescription>
            </Alert>
          ) : template.type === "stdio" ? (
            <Alert>
              <IconAlertTriangle />
              <AlertTitle>This extension runs code on your device</AlertTitle>
              <AlertDescription>
                Only install it if you trust the developer. It may not work correctly on all
                devices.
              </AlertDescription>
            </Alert>
          ) : null}

          {missingRuntime ? (
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertTitle>{`"${missingRuntime}" isn't installed`}</AlertTitle>
              <AlertDescription>
                This extension needs it to run. You can still install the extension, but it won't
                work until the tool is available.
              </AlertDescription>
            </Alert>
          ) : null}

          {template.fields.map((field) => (
            <InstallField
              key={field.id}
              field={field}
              value={fieldValues[field.id] ?? ""}
              inCommand={isInCommand(field)}
              onChange={(value) =>
                setFieldValues((previous) => ({ ...previous, [field.id]: value }))
              }
            />
          ))}

          {needsOAuthClient ? (
            <>
              <Field>
                <FieldLabel htmlFor="install-oauth-client-id">
                  Client ID
                  <span className="text-muted-foreground">(required)</span>
                </FieldLabel>
                <Input
                  id="install-oauth-client-id"
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <FieldDescription className="wrap-anywhere">
                  {`Create an OAuth app in your ${name} account and paste its client ID here. Use http://127.0.0.1/callback as the redirect address.`}
                  {oauthClient?.helpUrl ? (
                    <>
                      {" "}
                      <a href={oauthClient.helpUrl} target="_blank" rel="noopener noreferrer">
                        Where do I find this?
                      </a>
                    </>
                  ) : null}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="install-oauth-client-secret">Client secret</FieldLabel>
                <SecretInput
                  id="install-oauth-client-secret"
                  value={clientSecret}
                  onChange={setClientSecret}
                  placeholder=""
                />
                <FieldDescription>
                  Leave this empty if your OAuth app doesn't have one.
                </FieldDescription>
              </Field>
            </>
          ) : null}

          <Accordion type="single" collapsible className="rounded-md border px-3">
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced settings</AccordionTrigger>
              <AccordionContent>
                <McpServerConfigForm
                  idPrefix="install-extension"
                  values={formValues}
                  onChange={(updates) => setFormValues((current) => ({ ...current, ...updates }))}
                  showTransportEditors={false}
                  showApprovalControls
                  commandPlaceholder="npx -y ..."
                  urlPlaceholder="https://..."
                  approvalDescription="Ask before running tools from this extension, unless in Auto mode"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FieldGroup>
      </div>

      {untrusted ? (
        <Field orientation="horizontal">
          <Checkbox
            id="install-trust"
            checked={trusted}
            onCheckedChange={(checked) => setTrusted(checked === true)}
          />
          <FieldLabel htmlFor="install-trust">I trust the developer of this extension</FieldLabel>
        </Field>
      ) : null}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={install} disabled={!isValid}>
          Install
        </Button>
      </DialogFooter>
    </>
  );
}

export function InstallDialog({
  installKey,
  name,
  templates,
  notes = [],
  signInAfterInstall = false,
  untrusted = false,
  initialValues,
  oauthClient,
  open,
  onOpenChange,
  onInstall,
}: {
  installKey?: string;
  name: string;
  templates: ExtensionInstallTemplate[];
  notes?: string[];
  signInAfterInstall?: boolean;
  untrusted?: boolean;
  initialValues?: InstallInitialValues;
  oauthClient?: { helpUrl?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (
    server: ExtensionInstallResult,
    template: ExtensionInstallTemplate,
    oauthClient?: InstallOAuthClient,
    fieldValues?: Record<string, string>,
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && templates.length ? (
          <InstallDialogBody
            key={installKey}
            name={name}
            templates={templates}
            notes={notes}
            signInAfterInstall={signInAfterInstall}
            untrusted={untrusted}
            initialValues={initialValues}
            oauthClient={oauthClient}
            onClose={() => onOpenChange(false)}
            onInstall={onInstall}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
