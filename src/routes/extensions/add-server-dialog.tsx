import { IconAlertTriangle } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { SecretInput } from "@/components/a1/input/secret-input";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type McpServerType } from "@/lib/settings/types";

import { McpServerConfigForm, type McpServerConfigFormValues } from "./mcp-server-config-form";

// TODO: Warn you when it looks like you're installing a custom MCP server that you already have installed

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
    oauthClient?: { clientId: string; clientSecret?: string };
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
  const [formValues, setFormValues] = useState<McpServerConfigFormValues>({
    type: initialValues?.type ?? "stdio",
    name: initialValues?.name ?? "",
    command: initialValues?.command ?? "",
    env: {},
    url: initialValues?.url ?? "",
    headers: {},
    timeoutSec: 30,
    requiresApproval: true,
  });
  const [isFromDeepLink, setIsFromDeepLink] = useState(!!initialValues);
  const [oauthClientId, setOAuthClientId] = useState("");
  const [oauthClientSecret, setOAuthClientSecret] = useState("");

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
      requiresApproval: true,
    });
    setIsFromDeepLink(false);
    setOAuthClientId("");
    setOAuthClientSecret("");
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
      oauthClient:
        formValues.type === "http" && oauthClientId.trim()
          ? {
              clientId: oauthClientId.trim(),
              clientSecret: oauthClientSecret.trim() || undefined,
            }
          : undefined,
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

        {isFromDeepLink ? (
          <Alert variant="destructive">
            <IconAlertTriangle />
            <AlertTitle>Extension details were auto-filled</AlertTitle>
            <AlertDescription>
              Review the details below before installing. Only install extensions you trust.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          <McpServerConfigForm
            idPrefix="new-server-dialog"
            className="py-1"
            showTypeSelector
            values={formValues}
            onChange={(updates) => setFormValues((current) => ({ ...current, ...updates }))}
            namePlaceholder="e.g., Everything Server"
            showStdioWarning
            showApprovalControls
            httpSupplement={
              <>
                <Field>
                  <FieldLabel htmlFor="new-server-dialog-oauth-client-id">
                    OAuth client ID
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    id="new-server-dialog-oauth-client-id"
                    value={oauthClientId}
                    onChange={(event) => setOAuthClientId(event.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <FieldDescription>
                    Only needed if the service asks you to create your own OAuth app. Use
                    http://127.0.0.1/callback as the redirect address.
                  </FieldDescription>
                </Field>
                {oauthClientId.trim() ? (
                  <Field>
                    <FieldLabel htmlFor="new-server-dialog-oauth-client-secret">
                      OAuth client secret
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <SecretInput
                      id="new-server-dialog-oauth-client-secret"
                      value={oauthClientSecret}
                      onChange={setOAuthClientSecret}
                      placeholder=""
                    />
                  </Field>
                ) : null}
              </>
            }
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
