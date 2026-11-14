import { IconLogin, IconLogout } from "@tabler/icons-react";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

import { SecretInput } from "@/components/a1/input/secret-input";
import { SettingsRow } from "@/components/settings-components/setting-controls";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import {
  getMcpOAuthClient,
  type McpOAuthClient,
  mcpCheckAuth,
  mcpLogin,
  mcpLogout,
  setMcpOAuthClient,
} from "@/lib/ai/tools/mcp/oauth";
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

function OAuthClientForm({
  server,
  onSaved,
}: {
  server: McpHttpServerConfig;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState<McpOAuthClient | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const savedClientId = saved?.clientId ?? "";
  const hasChanges = clientId.trim() !== savedClientId || clientSecret.trim() !== "";

  useEffect(() => {
    let active = true;
    void getMcpOAuthClient(server.id)
      .then((client) => {
        if (!active) return;
        setSaved(client);
        setClientId(client?.clientId ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [server.id]);

  const save = async () => {
    if (!hasChanges || busy) return;
    setBusy(true);
    try {
      const nextClientId = clientId.trim();
      await setMcpOAuthClient(server.id, nextClientId, clientSecret.trim() || undefined);
      const client = await getMcpOAuthClient(server.id);
      setSaved(client);
      setClientId(client?.clientId ?? "");
      setClientSecret("");
      onSaved();
      toast.success(
        nextClientId ? "OAuth app saved. Connect your account again." : "OAuth app removed",
      );
    } catch (error) {
      toast.error(`Couldn't save the OAuth app: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="border-t px-4 pt-4 pb-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`oauth-client-id-${server.id}`}>OAuth client ID</FieldLabel>
          <Input
            id={`oauth-client-id-${server.id}`}
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <FieldDescription>
            Only needed if this extension asks you to create your own OAuth app. Changing it signs
            you out of this extension.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`oauth-client-secret-${server.id}`}>OAuth client secret</FieldLabel>
          <SecretInput
            id={`oauth-client-secret-${server.id}`}
            value={clientSecret}
            onChange={setClientSecret}
            placeholder={saved?.hasSecret ? "Saved. Enter a new one to replace it." : ""}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!hasChanges || busy}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Save OAuth app
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function ConnectionCard({
  server,
  onSave,
  onOAuthClientSaved,
}: {
  server: McpServerConfig;
  onSave: (updates: Partial<McpServerConfig>) => void;
  onOAuthClientSaved: () => void;
}) {
  const saved = getConnectionValues(server);
  const [draft, setDraft] = useState(saved);
  const values = { ...draft, requiresApproval: saved.requiresApproval };
  const hasChanges = JSON.stringify(values) !== JSON.stringify(saved);
  const isValid =
    values.name.trim() !== "" &&
    Number.isFinite(values.timeoutSec) &&
    values.timeoutSec >= 0.1 &&
    (values.type === "stdio" ? values.command.trim() !== "" : values.url.trim() !== "");

  const save = () => {
    if (!hasChanges || !isValid) return;
    const name = values.name.trim();
    const command = values.command.trim();
    const url = values.url.trim();
    const shared = { name, timeoutMs: values.timeoutSec * 1000 };
    onSave(
      values.type === "stdio"
        ? { ...shared, command, env: values.env }
        : { ...shared, url, headers: values.headers },
    );
    setDraft({ ...values, name, command, url });
  };

  return (
    <Card className="py-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger className="items-center gap-3 rounded-xl p-4 hover:no-underline">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-base leading-snug font-medium">Advanced</span>
              <span className="text-muted-foreground text-sm font-normal">
                Only change these settings if you know what you're doing.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <form
              id={`connection-${server.id}`}
              className="px-4 pt-1 pb-4"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <McpServerConfigForm
                idPrefix={`settings-${server.id}`}
                values={values}
                onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
              />
            </form>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasChanges}
                onClick={() => setDraft(saved)}
              >
                Discard
              </Button>
              <Button
                type="submit"
                form={`connection-${server.id}`}
                size="sm"
                disabled={!hasChanges || !isValid}
              >
                Save
              </Button>
            </CardFooter>
            {server.type === "http" ? (
              <OAuthClientForm server={server} onSaved={onOAuthClientSaved} />
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export function ExtensionSettings({
  server,
  about,
}: {
  server: McpServerConfig;
  about: ReactNode;
}) {
  const { loadStates, authStates, updateServer, restartServer } = useExtensionActions();
  const loadState = loadStates[server.id];
  const authState = authStates[server.id];
  const status = getServerStatus(loadState, authState, server.enabled);
  const tools = server.enabled && loadState?.status === "loaded" ? (loadState.tools ?? []) : [];

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

      {about}

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
        {tools.length ? (
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

      <ConnectionCard
        server={server}
        onSave={(updates) => updateServer(server.id, updates)}
        onOAuthClientSaved={() => restartServer(server.id)}
      />
    </>
  );
}
