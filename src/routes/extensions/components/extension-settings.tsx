import { IconAlertTriangle, IconLogin, IconLogout, IconPencil } from "@tabler/icons-react";
import { Fragment, useEffect, useState } from "react";

import { SettingsRow } from "@/components/settings-components/setting-controls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { mcpCheckAuth, mcpLogin, mcpLogout } from "@/lib/ai/tools/mcp/oauth";
import type { McpAuthState, McpServerToolInfo } from "@/lib/jotai/mcp-atoms";
import type { McpHttpServerConfig, McpServerConfig } from "@/lib/settings/types";

import { McpServerConfigForm, type McpServerConfigFormValues } from "../mcp-server-config-form";
import { getServerStatus } from "../model";
import { useExtensionActions } from "../use-extension-actions";

function AccountRow({
  server,
  authState,
}: {
  server: McpHttpServerConfig;
  authState: McpAuthState;
}) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authState === undefined && server.enabled) void mcpCheckAuth(server.id, server.url);
  }, [server.id, server.url, server.enabled, authState]);

  if (!server.enabled || authState === "no-auth") return null;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsRow
      layout="row"
      label="Account"
      description={
        authState === undefined
          ? "Checking sign-in status..."
          : authState === "logged-in"
            ? "Connected"
            : authState === "supports-oauth"
              ? "Connect your account for full access."
              : "Not connected"
      }
    >
      {authState === undefined ? (
        <Spinner />
      ) : authState === "logged-in" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => run(() => mcpLogout(server.id, server.name))}
        >
          {busy ? <Spinner data-icon="inline-start" /> : <IconLogout data-icon="inline-start" />}
          Disconnect
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={busy}
          onClick={() => run(() => mcpLogin(server.id, server.url, server.name))}
        >
          {busy ? <Spinner data-icon="inline-start" /> : <IconLogin data-icon="inline-start" />}
          Connect
        </Button>
      )}
    </SettingsRow>
  );
}

function ToolApprovals({
  server,
  tools,
  onChange,
}: {
  server: McpServerConfig;
  tools: McpServerToolInfo[];
  onChange: (overrides: Record<string, boolean>) => void;
}) {
  return (
    <FieldGroup className="max-h-96 gap-3 overflow-x-hidden overflow-y-auto px-1 py-2">
      {tools.map((tool, index) => {
        const displayName = getToolDisplayName(tool.name, tool.title);
        const override = server.toolApprovalOverrides?.[tool.name];
        const requiresApproval = override ?? server.requiresApproval;
        const id = `tool-approval-${server.id}-${tool.name}`;
        return (
          <Fragment key={tool.name}>
            {index > 0 ? <FieldSeparator /> : null}
            <Field orientation="horizontal">
              <FieldLabel htmlFor={id} className="min-w-0">
                <span className="truncate">{displayName}</span>
              </FieldLabel>
              <span className="text-muted-foreground shrink-0 text-xs">
                {override === undefined ? "Default" : requiresApproval ? "Always ask" : "Never ask"}
              </span>
              <Switch
                id={id}
                checked={requiresApproval}
                aria-label={`Ask before running ${displayName}`}
                onCheckedChange={(checked) => {
                  const next = { ...server.toolApprovalOverrides };
                  if (checked === server.requiresApproval) delete next[tool.name];
                  else next[tool.name] = checked;
                  onChange(next);
                }}
              />
            </Field>
          </Fragment>
        );
      })}
    </FieldGroup>
  );
}

function getConnectionValues(server: McpServerConfig): McpServerConfigFormValues {
  return {
    type: server.type,
    name: server.name,
    command: server.type === "stdio" ? server.command : "",
    env: server.type === "stdio" ? server.env : {},
    url: server.type === "http" ? server.url : "",
    headers: server.type === "http" ? server.headers : {},
    timeoutSec: server.timeoutMs / 1000,
    requiresApproval: server.requiresApproval,
  };
}

function ConnectionDialogBody({
  server,
  onClose,
  onSave,
}: {
  server: McpServerConfig;
  onClose: () => void;
  onSave: (updates: Partial<McpServerConfig>) => void;
}) {
  const [values, setValues] = useState(() => getConnectionValues(server));
  const hasChanges = JSON.stringify(values) !== JSON.stringify(getConnectionValues(server));
  const isValid =
    values.name.trim() !== "" &&
    Number.isFinite(values.timeoutSec) &&
    values.timeoutSec >= 0.1 &&
    (values.type === "stdio" ? values.command.trim() !== "" : values.url.trim() !== "");

  const save = () => {
    if (!isValid) return;
    const shared = { name: values.name.trim(), timeoutMs: values.timeoutSec * 1000 };
    onSave(
      values.type === "stdio"
        ? { ...shared, command: values.command.trim(), env: values.env }
        : { ...shared, url: values.url.trim(), headers: values.headers },
    );
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit connection</DialogTitle>
        <DialogDescription>
          Change how AgentOne connects to this extension. Nothing changes until you save.
        </DialogDescription>
      </DialogHeader>
      <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
        <McpServerConfigForm
          idPrefix={`settings-${server.id}`}
          className="py-1"
          values={values}
          onChange={(updates) => setValues((current) => ({ ...current, ...updates }))}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!hasChanges || !isValid}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

export function ExtensionSettings({ server }: { server: McpServerConfig }) {
  const { loadStates, authStates, updateServer } = useExtensionActions();
  const loadState = loadStates[server.id];
  const authState = authStates[server.id];
  const status = getServerStatus(loadState, authState, server.enabled);
  const tools = server.enabled && loadState?.status === "loaded" ? (loadState.tools ?? []) : [];
  const [editingConnection, setEditingConnection] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsRow
            layout="row"
            htmlFor={`enabled-${server.id}`}
            label="Turn on"
            description="Lets AgentOne use this extension's tools."
          >
            <Switch
              id={`enabled-${server.id}`}
              checked={server.enabled}
              onCheckedChange={(enabled) => updateServer(server.id, { enabled })}
            />
          </SettingsRow>

          {server.type === "http" ? <AccountRow server={server} authState={authState} /> : null}

          <SettingsRow
            layout="row"
            htmlFor={`approval-${server.id}`}
            label="Ask before running tools"
            description="Asks for confirmation before each tool runs, unless in Auto mode."
          >
            <Switch
              id={`approval-${server.id}`}
              checked={server.requiresApproval}
              onCheckedChange={(requiresApproval) => updateServer(server.id, { requiresApproval })}
            />
          </SettingsRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>
            {!server.enabled
              ? "Turn this extension on to set approvals per tool."
              : status.tone === "warn"
                ? status.description
                : status.tone === "error"
                  ? "Tools couldn't be loaded."
                  : loadState?.status !== "loaded"
                    ? "Tools will appear once the extension finishes loading."
                    : tools.length
                      ? "Choose which tools ask before running. Tools you haven't changed follow the setting above."
                      : "This extension has no tools right now."}
          </CardDescription>
        </CardHeader>
        {server.enabled && status.tone === "error" ? (
          <CardContent>
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertDescription className="wrap-anywhere">{status.description}</AlertDescription>
            </Alert>
          </CardContent>
        ) : tools.length ? (
          <CardContent>
            <ToolApprovals
              server={server}
              tools={tools}
              onChange={(toolApprovalOverrides) =>
                updateServer(server.id, { toolApprovalOverrides })
              }
            />
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>
            {server.type === "stdio" ? "Runs on this device" : "Connects online"}
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setEditingConnection(true)}>
              <IconPencil data-icon="inline-start" />
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="bg-muted rounded-md p-3 font-mono text-xs wrap-anywhere">
            {server.type === "stdio" ? server.command : server.url}
          </p>
        </CardContent>
      </Card>

      <Dialog open={editingConnection} onOpenChange={setEditingConnection}>
        <DialogContent>
          {editingConnection ? (
            <ConnectionDialogBody
              server={server}
              onClose={() => setEditingConnection(false)}
              onSave={(updates) => updateServer(server.id, updates)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
