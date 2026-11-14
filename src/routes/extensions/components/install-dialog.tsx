import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { ExternalLink } from "@/components/a1/external-link";
import { SecretInput } from "@/components/a1/input/secret-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createServerFromInstall,
  getStdioRuntimeCommand,
  type ExtensionInstallResult,
  type ExtensionInstallTemplate,
  type ExtensionInstallField,
} from "@/lib/extensions/install";
import { isCommandAvailable } from "@/lib/run-command";

import { McpServerConfigForm, type McpServerConfigFormValues } from "../mcp-server-config-form";

function getFieldError(field: ExtensionInstallField, value: string): string | undefined {
  const text = value.trim();
  if (!text) return undefined;
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
  onChange,
}: {
  field: ExtensionInstallField;
  value: string;
  onChange: (value: string) => void;
}) {
  const options: NonNullable<ExtensionInstallField["options"]> | undefined =
    field.options ?? field.choices?.map((choice) => ({ value: choice, label: choice }));
  const error = getFieldError(field, value);
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
            <ExternalLink href={field.helpUrl}>Where do I find this?</ExternalLink>
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

function getDefaults(
  template: ExtensionInstallTemplate,
  name: string,
): { form: McpServerConfigFormValues; fields: Record<string, string> } {
  return {
    form: {
      type: template.type,
      name,
      command: template.commandTemplate ?? "",
      env: {},
      url: template.urlTemplate ?? "",
      headers: {},
      timeoutSec: 30,
      requiresApproval: true,
    },
    fields: Object.fromEntries(template.fields.map((field) => [field.id, field.defaultValue])),
  };
}

function InstallDialogBody({
  name,
  templates,
  notes,
  signInAfterInstall,
  oauthClient,
  onClose,
  onInstall,
}: {
  name: string;
  templates: ExtensionInstallTemplate[];
  notes: string[];
  signInAfterInstall: boolean;
  oauthClient?: { helpUrl?: string };
  onClose: () => void;
  onInstall: (
    server: ExtensionInstallResult,
    template: ExtensionInstallTemplate,
    oauthClient?: InstallOAuthClient,
  ) => void;
}) {
  const [templateId, setTemplateId] = useState(templates[0].id);
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const [formValues, setFormValues] = useState(() => getDefaults(templates[0], name).form);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    () => getDefaults(templates[0], name).fields,
  );
  const [runtimeCheck, setRuntimeCheck] = useState<{ command: string; available: boolean }>();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
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
    template.fields.every((field) => {
      const value = fieldValues[field.id] ?? "";
      return (!field.required || value.trim() !== "") && !getFieldError(field, value);
    });

  const install = () => {
    if (!isValid) return;
    const result = createServerFromInstall(template, {
      name: formValues.name.trim(),
      timeoutSec: formValues.timeoutSec,
      requiresApproval: formValues.requiresApproval,
      fieldValues,
      command: template.type === "stdio" ? formValues.command : undefined,
      url: template.type === "http" ? formValues.url : undefined,
    });
    if (!result) return;
    onInstall(
      result,
      template,
      needsOAuthClient
        ? { clientId: clientId.trim(), clientSecret: clientSecret.trim() }
        : undefined,
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

          {template.type === "stdio" ? (
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
                  {`Create an OAuth app in your ${name} account and paste its client ID here.`}
                  {oauthClient?.helpUrl ? (
                    <>
                      {" "}
                      <ExternalLink href={oauthClient.helpUrl}>Where do I find this?</ExternalLink>
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
              <AccordionTrigger className="items-center">Advanced settings</AccordionTrigger>
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
  name,
  templates,
  notes = [],
  signInAfterInstall = false,
  oauthClient,
  open,
  onOpenChange,
  onInstall,
}: {
  name: string;
  templates: ExtensionInstallTemplate[];
  notes?: string[];
  signInAfterInstall?: boolean;
  oauthClient?: { helpUrl?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (
    server: ExtensionInstallResult,
    template: ExtensionInstallTemplate,
    oauthClient?: InstallOAuthClient,
  ) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && templates.length ? (
          <InstallDialogBody
            name={name}
            templates={templates}
            notes={notes}
            signInAfterInstall={signInAfterInstall}
            oauthClient={oauthClient}
            onClose={() => onOpenChange(false)}
            onInstall={onInstall}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
