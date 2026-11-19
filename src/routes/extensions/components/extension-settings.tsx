import { IconAlertTriangle, IconLogin, IconRefresh } from "@tabler/icons-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  setMcpOAuthClient,
} from "@/lib/ai/tools/mcp/oauth";
import type { McpServerToolInfo } from "@/lib/jotai/mcp-atoms";
import type { McpHttpServerConfig, McpServerConfig } from "@/lib/settings/types";

import { McpServerConfigForm, type McpServerConfigFormValues } from "../mcp-server-config-form";
import { getServerStatus, type ServerStatus } from "../model";
import { useExtensionActions } from "../use-extension-actions";

function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };
  return [busy, run] as const;
}

function SignInButton({ server }: { server: McpHttpServerConfig }) {
  const [busy, run] = useBusy();
  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={() => run(() => mcpLogin(server.id, server.url, server.name))}
    >
      {busy ? <Spinner data-icon="inline-start" /> : <IconLogin data-icon="inline-start" />}
      Sign in
    </Button>
  );
}

function StatusNotice({
  server,
  status,
  onRetry,
}: {
  server: McpServerConfig;
  status: ServerStatus;
  onRetry: () => void;
}) {
  if (status.tone === "warn" && server.type === "http") {
    return (
      <Alert>
        <IconLogin />
        <AlertTitle>Sign in to finish setting up</AlertTitle>
        <AlertDescription>
          <p>This extension needs you to sign in to your account before AgentOne can use it.</p>
          <SignInButton server={server} />
        </AlertDescription>
      </Alert>
    );
  }
  if (status.tone !== "error") return null;
  return (
    <Alert variant="destructive">
      <IconAlertTriangle />
      <AlertTitle>This extension couldn't connect</AlertTitle>
      <AlertDescription className="min-w-0">
        <p>
          Try again in a moment. If it keeps happening, the extension may need to be set up again.
        </p>
        <div className="flex flex-col items-start gap-3">
          <Button variant="outline" size="sm" className="text-foreground" onClick={onRetry}>
            <IconRefresh data-icon="inline-start" />
            Try again
          </Button>
          <details className="text-muted-foreground max-w-full text-xs">
            <summary className="hover:text-foreground cursor-pointer select-none">
              Technical details
            </summary>
            <p className="mt-1 font-mono wrap-anywhere">{status.description}</p>
          </details>
        </div>
      </AlertDescription>
    </Alert>
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
    <FieldGroup className="max-h-96 gap-1.5 overflow-x-hidden overflow-y-auto px-1 py-2">
      {tools.map((tool, index) => {
        const displayName = getToolDisplayName(tool.name, tool.title);
        const override = server.toolApprovalOverrides?.[tool.name];
        const requiresApproval = override ?? server.requiresApproval;
        const id = `tool-approval-${server.id}-${tool.name}`;
        return (
          <Fragment key={tool.name}>
            {index > 0 ? <FieldSeparator className="shrink-0" /> : null}
            <Field orientation="horizontal">
              <FieldLabel htmlFor={id} className="min-w-0 font-normal">
                <span className="truncate">{displayName}</span>
              </FieldLabel>
              <span className="text-muted-foreground shrink-0 text-xs">
                {override === undefined ? "Default" : requiresApproval ? "Always ask" : "Never ask"}
              </span>
              <Switch
                id={id}
                checked={requiresApproval}
                aria-label={`Ask before using ${displayName}`}
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
  const [oauthClient, setOAuthClient] = useState<McpOAuthClient | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const values = { ...draft, requiresApproval: saved.requiresApproval };
  const connectionChanged = JSON.stringify(values) !== JSON.stringify(saved);
  const oauthChanged =
    clientId.trim() !== (oauthClient?.clientId ?? "") || clientSecret.trim() !== "";
  const hasChanges = connectionChanged || oauthChanged;
  const isValid =
    values.name.trim() !== "" &&
    Number.isFinite(values.timeoutSec) &&
    values.timeoutSec >= 0.1 &&
    (values.type === "stdio" ? values.command.trim() !== "" : values.url.trim() !== "");

  useEffect(() => {
    if (server.type !== "http") return;
    let active = true;
    void getMcpOAuthClient(server.id)
      .then((client) => {
        if (!active) return;
        setOAuthClient(client);
        setClientId(client?.clientId ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [server.id, server.type]);

  const save = async () => {
    if (!hasChanges || !isValid || busy) return;
    if (connectionChanged) {
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
    }
    if (!oauthChanged) return;
    setBusy(true);
    try {
      const nextClientId = clientId.trim();
      await setMcpOAuthClient(server.id, nextClientId, clientSecret.trim() || undefined);
      const client = await getMcpOAuthClient(server.id);
      setOAuthClient(client);
      setClientId(client?.clientId ?? "");
      setClientSecret("");
      onOAuthClientSaved();
      toast.success(nextClientId ? "OAuth app saved. Sign in again." : "OAuth app removed");
    } catch (error) {
      toast.error(`Couldn't save the OAuth app: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="py-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger className="items-center gap-3 rounded-xl p-4 hover:no-underline">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-base leading-snug font-medium">Advanced</span>
              <span className="text-muted-foreground text-sm font-normal">
                Connection details. Most people never need to change these.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <form
              id={`connection-${server.id}`}
              className="px-4 pt-1 pb-4"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <McpServerConfigForm
                idPrefix={`settings-${server.id}`}
                values={values}
                onChange={(updates) => setDraft((current) => ({ ...current, ...updates }))}
                httpSupplement={
                  <>
                    <Field>
                      <FieldLabel htmlFor={`oauth-client-id-${server.id}`}>
                        OAuth client ID
                      </FieldLabel>
                      <Input
                        id={`oauth-client-id-${server.id}`}
                        value={clientId}
                        onChange={(event) => setClientId(event.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <FieldDescription>
                        Only needed if this extension asks you to create your own OAuth app.
                        Changing it signs you out of this extension.
                      </FieldDescription>
                    </Field>
                    {clientId.trim() ? (
                      <Field>
                        <FieldLabel htmlFor={`oauth-client-secret-${server.id}`}>
                          OAuth client secret
                        </FieldLabel>
                        <SecretInput
                          id={`oauth-client-secret-${server.id}`}
                          value={clientSecret}
                          onChange={setClientSecret}
                          placeholder={
                            oauthClient?.hasSecret ? "Saved. Enter a new one to replace it." : ""
                          }
                        />
                      </Field>
                    ) : null}
                  </>
                }
              />
            </form>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasChanges || busy}
                onClick={() => {
                  setDraft(saved);
                  setClientId(oauthClient?.clientId ?? "");
                  setClientSecret("");
                }}
              >
                Discard
              </Button>
              <Button
                type="submit"
                form={`connection-${server.id}`}
                size="sm"
                disabled={!hasChanges || !isValid || busy}
              >
                {busy ? <Spinner data-icon="inline-start" /> : null}
                Save
              </Button>
            </CardFooter>
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
  const tools = loadState?.tools ?? [];
  const url = server.type === "http" ? server.url : undefined;

  useEffect(() => {
    if (url && server.enabled && authState === undefined) void mcpCheckAuth(server.id, url);
  }, [server.id, url, server.enabled, authState]);

  return (
    <>
      {server.enabled ? (
        <>
          <StatusNotice server={server} status={status} onRetry={() => restartServer(server.id)} />

          {status.tone === "ok" ? (
            <Card>
              <CardHeader>
                <CardTitle>Tools</CardTitle>
                <CardDescription>
                  Tools are the actions this extension lets AgentOne take for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <SettingsRow
                  layout="row"
                  htmlFor={`approval-${server.id}`}
                  label="Ask before using tools"
                  description="AgentOne checks with you first each time, except in Auto mode."
                >
                  <Switch
                    id={`approval-${server.id}`}
                    checked={server.requiresApproval}
                    onCheckedChange={(requiresApproval) =>
                      updateServer(server.id, { requiresApproval })
                    }
                  />
                </SettingsRow>
                {tools.length ? (
                  <div className="flex flex-col gap-1 border-t pt-4">
                    <p className="text-muted-foreground text-sm">Or choose for each tool:</p>
                    <ToolApprovals
                      server={server}
                      tools={tools}
                      onChange={(toolApprovalOverrides) =>
                        updateServer(server.id, { toolApprovalOverrides })
                      }
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground border-t pt-4 text-sm">
                    This extension doesn't have any tools right now.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      {about}

      <ConnectionCard
        server={server}
        onSave={(updates) => updateServer(server.id, updates)}
        onOAuthClientSaved={() => restartServer(server.id)}
      />
    </>
  );
}
