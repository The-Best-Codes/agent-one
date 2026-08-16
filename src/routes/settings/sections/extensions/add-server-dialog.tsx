import { IconAlertTriangle } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { type McpServerType } from "@/lib/settings/types";

import { McpServerConfigForm, type McpServerConfigFormValues } from "./mcp-server-config-form";

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
  initialValues?: {
    name: string;
    type: "stdio" | "http";
    command?: string;
    url?: string;
  } | null;
}

export function AddServerDialog({
  open,
  onOpenChange,
  onAddServer,
  initialValues,
}: AddServerDialogProps) {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<McpServerConfigFormValues>({
    type: initialValues?.type ?? "stdio",
    name: initialValues?.name ?? "",
    command: initialValues?.command ?? "",
    env: {},
    url: initialValues?.url ?? "",
    headers: {},
    timeoutSec: 30,
    requiresApproval: false,
  });
  const [isFromDeepLink, setIsFromDeepLink] = useState(!!initialValues);

  const isAddFormValid = useMemo(() => {
    if (!formValues.name.trim()) {
      return false;
    }

    if (!Number.isFinite(formValues.timeoutSec) || formValues.timeoutSec < 0.1) {
      return false;
    }

    return formValues.type === "stdio"
      ? formValues.command.trim() !== ""
      : formValues.url.trim() !== "";
  }, [formValues]);

  const resetAddForm = () => {
    setFormValues({
      type: "stdio",
      name: "",
      command: "",
      env: {},
      url: "",
      headers: {},
      timeoutSec: 30,
      requiresApproval: false,
    });
    setIsFromDeepLink(false);
  };

  const handleAddServer = () => {
    if (!isAddFormValid) return;

    onAddServer({
      type: formValues.type,
      name: formValues.name.trim(),
      command: formValues.type === "stdio" ? formValues.command.trim() : undefined,
      env: formValues.type === "stdio" ? formValues.env : undefined,
      url: formValues.type === "http" ? formValues.url.trim() : undefined,
      headers: formValues.type === "http" ? formValues.headers : undefined,
      timeoutSec: formValues.timeoutSec,
      requiresApproval: formValues.requiresApproval,
    });

    trackSettingsInteraction("extensions", "submit_add_custom_extension", {
      type: formValues.type,
      requires_approval: formValues.requiresApproval,
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
          <DialogTitle>{t("extensions.addCustomTitle")}</DialogTitle>
          <DialogDescription>{t("extensions.addCustomDescription")}</DialogDescription>
        </DialogHeader>

        {isFromDeepLink ? (
          <Alert variant="destructive">
            <IconAlertTriangle />
            <AlertTitle>{t("extensions.autoFilled")}</AlertTitle>
            <AlertDescription>{t("extensions.autoFilledDescription")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          <McpServerConfigForm
            idPrefix="new-server-dialog"
            className="grid gap-4 py-4"
            showTypeSelector
            values={formValues}
            onChange={(updates) => setFormValues((current) => ({ ...current, ...updates }))}
            namePlaceholder={t("extensions.namePlaceholderExample")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelAdd}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleAddServer} disabled={!isAddFormValid}>
            {t("extensions.addCustomAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
