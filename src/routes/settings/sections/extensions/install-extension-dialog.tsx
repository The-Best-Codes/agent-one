import { IconAlertTriangle, IconEye, IconEyeClosed } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createMcpServerFromRegistryInstall,
  getStdioRuntimeCommand,
  type McpRegistryExtension,
  type McpRegistryInstallResult,
  type RegistryInstallField,
} from "@/assets/mcp-registry/mcp-registry";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
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
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { isCommandAvailable } from "@/lib/run-command";

import { McpServerConfigForm, type McpServerConfigFormValues } from "./mcp-server-config-form";

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
  const { t } = useTranslation();
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
            analytics={{
              event: "settings_interaction",
              params: { section: "extensions", control: "toggle_install_secret_visibility" },
            }}
            title={showSecret ? t("common.hideValue") : t("common.showValue")}
          >
            {showSecret ? (
              <IconEyeClosed data-icon="inline-start" />
            ) : (
              <IconEye data-icon="inline-start" />
            )}
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
  const { t } = useTranslation();
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

  const [formValues, setFormValues] = useState<McpServerConfigFormValues>({
    type: install?.type ?? "stdio",
    name: extension.displayName,
    command: install?.commandTemplate || "",
    env: {},
    url: install?.urlTemplate || "",
    headers: {},
    timeoutSec: 30,
    requiresApproval: false,
  });
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(defaultFieldValues);
  const [runtimeCheck, setRuntimeCheck] = useState<{
    command: string;
    available: boolean;
  } | null>(null);

  const runtimeCommand =
    install?.type === "stdio" ? getStdioRuntimeCommand(formValues.command) : undefined;

  const missingRuntimeCommand =
    runtimeCheck && runtimeCheck.command === runtimeCommand && !runtimeCheck.available
      ? runtimeCheck.command
      : null;

  useEffect(() => {
    let cancelled = false;

    if (!runtimeCommand) {
      return;
    }

    void isCommandAvailable(runtimeCommand).then((available) => {
      if (!cancelled) {
        setRuntimeCheck({ command: runtimeCommand, available });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [runtimeCommand]);

  if (!install) {
    return null;
  }

  const requiredFields = install.fields.filter((field) => field.required);
  const detectedConfigurationContent =
    install.fields.length > 0 ? (
      <div className="rounded-md border p-3">
        <p className="mb-3 text-xs font-medium">{t("extensions.detectedConfig")}</p>
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
    formValues.name.trim() !== "" &&
    Number.isFinite(formValues.timeoutSec) &&
    formValues.timeoutSec >= 0.1 &&
    (install.type === "stdio" ? formValues.command.trim() !== "" : formValues.url.trim() !== "") &&
    requiredFields.every((field) => (fieldValues[field.id] || "").trim() !== "");

  const handleInstall = () => {
    if (!isFormValid) {
      return;
    }

    const result = createMcpServerFromRegistryInstall(extension, {
      name: formValues.name.trim(),
      timeoutSec: formValues.timeoutSec,
      requiresApproval: formValues.requiresApproval,
      fieldValues,
      command: install.type === "stdio" ? formValues.command : undefined,
      url: install.type === "http" ? formValues.url : undefined,
    });

    if (!result) {
      return;
    }

    trackSettingsInteraction("extensions", "submit_install_extension", {
      type: install.type,
      requires_approval: formValues.requiresApproval,
      field_count: install.fields.length,
    });

    onInstall(result);
    onOpenChange(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("extensions.install", { name: extension.displayName })}</DialogTitle>
        <DialogDescription>{t("extensions.installDescription")}</DialogDescription>
      </DialogHeader>

      <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
        <McpServerConfigForm
          idPrefix="install-extension"
          className="grid gap-4 py-2"
          values={formValues}
          onChange={(updates) => setFormValues((current) => ({ ...current, ...updates }))}
          showTransportEditors={false}
          commandPlaceholder="npx -y ..."
          urlPlaceholder="https://..."
          approvalDescription={t("extensions.approvalDescription")}
          stdioSupplement={detectedConfigurationContent}
          httpSupplement={detectedConfigurationContent}
          showStdioWarning
        />
      </div>

      <DialogFooter>
        {missingRuntimeCommand ? (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <Label className="text-destructive w-fit sm:w-full">
                <IconAlertTriangle className="size-4" />
                <span className="truncate">{t("extensions.missingRuntimeTitle")}</span>
              </Label>
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent className="max-w-xs">
              {t("extensions.missingRuntimeDescription", { command: missingRuntimeCommand })}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        ) : (
          <div className="w-full" />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleInstall}
            disabled={!isFormValid}
            variant={missingRuntimeCommand ? "destructive" : "default"}
          >
            {t("extensions.installAction")}
          </Button>
        </div>
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
      <DialogContent>
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
