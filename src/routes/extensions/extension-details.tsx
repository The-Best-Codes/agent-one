import {
  IconAlertTriangle,
  IconArrowLeft,
  IconExternalLink,
  IconLogin,
  IconLogout,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { EnvVarsEditor } from "@/components/a1/input/env-vars-editor";
import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { mcpCheckAuth, mcpLogin, mcpLogout } from "@/lib/ai/tools/mcp/oauth";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { getInstalledRegistryMetadata } from "@/lib/mcp-registry/metadata";
import { type McpHttpServerConfig, type McpServerConfig } from "@/lib/settings/types";

import { getExtensionPublisher, isVerifiedExtension } from "./curated";
import { ExtensionIcon, ExtensionStatusBadge, VerifiedBadge } from "./extension-listing";
import { getExtensionStatus } from "./extension-status";

interface ExtensionDetailsProps {
  server: McpServerConfig;
  delisted: boolean;
  onBack: () => void;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
  onRestart: () => void;
  onUninstall: () => void;
}

function AccountCard({ server }: { server: McpHttpServerConfig }) {
  const authState = useAtomValue(mcpAuthStatesAtom)[server.id];
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authState === undefined && server.enabled) void mcpCheckAuth(server.id, server.url);
  }, [server.id, server.url, server.enabled, authState]);

  if (!server.enabled || authState === undefined || authState === "no-auth") return null;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    await action();
    setBusy(false);
  };

  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>
          {authState === "logged-in" ? "Account connected" : "Account not connected"}
        </ItemTitle>
        <ItemDescription>
          {authState === "logged-in"
            ? `You're signed in to ${server.name}.`
            : authState === "supports-oauth"
              ? "Sign in to unlock everything this extension can do."
              : "Sign in to start using this extension."}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        {authState === "logged-in" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run(() => mcpLogout(server.id, server.name))}
          >
            {busy ? <Spinner data-icon="inline-start" /> : <IconLogout data-icon="inline-start" />}
            Sign out
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => run(() => mcpLogin(server.id, server.url, server.name))}
          >
            {busy ? <Spinner data-icon="inline-start" /> : <IconLogin data-icon="inline-start" />}
            Sign in
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}

function PermissionsCard({
  server,
  onUpdate,
}: {
  server: McpServerConfig;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
}) {
  const loadState = useAtomValue(mcpServerLoadStatesAtom)[server.id];
  const tools = loadState?.status === "loaded" ? (loadState.tools ?? []) : [];
  const overrides = server.toolApprovalOverrides ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>Choose which actions need your approval before they run.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field orientation="horizontal">
          <div className="flex flex-1 flex-col gap-0.5">
            <FieldLabel htmlFor="extension-requires-approval">
              Ask before it takes actions
            </FieldLabel>
            <FieldDescription>Used for any tool you haven't set below.</FieldDescription>
          </div>
          <Switch
            id="extension-requires-approval"
            checked={server.requiresApproval}
            onCheckedChange={(requiresApproval) => onUpdate({ requiresApproval })}
          />
        </Field>
        {tools.length > 0 ? (
          <ItemGroup className="gap-0 rounded-lg border">
            {tools.map((tool) => {
              const displayName = getToolDisplayName(tool.name, tool.title);
              const override = overrides[tool.name];
              const checked = override ?? server.requiresApproval;
              return (
                <Item key={tool.name} size="sm" className="not-last:border-b-border rounded-none">
                  <ItemContent>
                    <ItemTitle>{displayName}</ItemTitle>
                    <ItemDescription>
                      {override === undefined
                        ? "Uses the default"
                        : checked
                          ? "Always asks first"
                          : "Never asks"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={checked}
                      aria-label={`Ask before using ${displayName}`}
                      onCheckedChange={(value) => {
                        const next = { ...overrides };
                        if (value === server.requiresApproval) delete next[tool.name];
                        else next[tool.name] = value;
                        onUpdate({ toolApprovalOverrides: next });
                      }}
                    />
                  </ItemActions>
                </Item>
              );
            })}
          </ItemGroup>
        ) : (
          <p className="text-muted-foreground text-sm">
            {server.enabled
              ? "Individual tools will show up here once the extension is ready."
              : "Turn the extension on to choose settings for individual tools."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getConnection(server: McpServerConfig) {
  const { name, timeoutMs } = server;
  return server.type === "stdio"
    ? { type: server.type, name, timeoutMs, command: server.command, env: server.env }
    : { type: server.type, name, timeoutMs, url: server.url, headers: server.headers };
}

type Connection = ReturnType<typeof getConnection>;

function ConnectionCard({
  connection,
  onUpdate,
}: {
  connection: Connection;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
}) {
  const [draft, setDraft] = useState(connection);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(connection);
  const isValid =
    draft.name.trim() !== "" &&
    draft.timeoutMs >= 100 &&
    (draft.type === "stdio" ? draft.command.trim() : draft.url.trim()) !== "";
  const update = (updates: Partial<Connection>) =>
    setDraft((previous) => ({ ...previous, ...updates }) as Connection);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <CardDescription>
          Advanced settings for how AgentOne talks to this extension.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="extension-name">Name</FieldLabel>
            <Input
              id="extension-name"
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
            />
          </Field>
          {draft.type === "stdio" ? (
            <>
              <Field>
                <FieldLabel htmlFor="extension-command">Command</FieldLabel>
                <Input
                  id="extension-command"
                  className="font-mono"
                  value={draft.command}
                  onChange={(event) => update({ command: event.target.value })}
                />
              </Field>
              <EnvVarsEditor id="extension" env={draft.env} onChange={(env) => update({ env })} />
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="extension-url">URL</FieldLabel>
                <Input
                  id="extension-url"
                  className="font-mono"
                  value={draft.url}
                  onChange={(event) => update({ url: event.target.value })}
                />
              </Field>
              <HttpHeadersEditor
                id="extension"
                headers={draft.headers}
                onChange={(headers) => update({ headers })}
              />
            </>
          )}
          <Field>
            <FieldLabel htmlFor="extension-timeout">Timeout (seconds)</FieldLabel>
            <Input
              id="extension-timeout"
              type="number"
              min="0.1"
              max="300"
              step="0.1"
              value={draft.timeoutMs / 1000}
              onChange={(event) => {
                const seconds = parseFloat(event.target.value);
                update({ timeoutMs: Number.isFinite(seconds) ? seconds * 1000 : 0 });
              }}
            />
            <FieldDescription>How long to wait for the extension to respond.</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
      {isDirty ? (
        <CardFooter className="justify-end gap-2 border-t">
          <Button variant="outline" onClick={() => setDraft(connection)}>
            Discard
          </Button>
          <Button
            disabled={!isValid}
            onClick={() =>
              onUpdate({
                name: draft.name.trim(),
                timeoutMs: draft.timeoutMs,
                ...(draft.type === "stdio"
                  ? { command: draft.command.trim(), env: draft.env }
                  : { url: draft.url.trim(), headers: draft.headers }),
              })
            }
          >
            Save changes
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function ExtensionDetails({
  server,
  delisted,
  onBack,
  onUpdate,
  onRestart,
  onUninstall,
}: ExtensionDetailsProps) {
  const loadState = useAtomValue(mcpServerLoadStatesAtom)[server.id];
  const authState = useAtomValue(mcpAuthStatesAtom)[server.id];
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const metadata = getInstalledRegistryMetadata(server);
  const status = getExtensionStatus(server.enabled, loadState, authState);
  const publisher = metadata ? getExtensionPublisher(server.id) : undefined;
  const connection = getConnection(server);
  const connectionKey = JSON.stringify(connection);

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <IconArrowLeft data-icon="inline-start" />
        All extensions
      </Button>

      <div className="flex items-start gap-4">
        <ExtensionIcon name={server.name} iconUrl={metadata?.iconUrl} className="size-16" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="truncate text-2xl font-semibold">{server.name}</h2>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
            {[
              publisher ? `by ${publisher}` : "Custom extension",
              metadata ? `v${metadata.version}` : undefined,
            ]
              .filter(Boolean)
              .join(" · ")}
            {metadata?.websiteUrl ? (
              <a
                href={metadata.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                Website
                <IconExternalLink className="size-3.5" />
              </a>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <ExtensionStatusBadge status={status} />
            {isVerifiedExtension(server.id) ? <VerifiedBadge /> : null}
          </div>
        </div>
        <Switch
          checked={server.enabled}
          onCheckedChange={(enabled) => onUpdate({ enabled })}
          aria-label="Turn extension on or off"
        />
      </div>

      {metadata?.description ? <p className="text-sm">{metadata.description}</p> : null}

      {status.kind === "error" ? (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertTitle>This extension isn't working</AlertTitle>
          <AlertDescription className="line-clamp-4 break-all">
            {status.description}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={onRestart}>
              <IconRefresh data-icon="inline-start" />
              Restart
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {delisted ? (
        <Alert>
          <IconAlertTriangle />
          <AlertTitle>No longer listed</AlertTitle>
          <AlertDescription>
            This extension was removed from the extension list. It may stop working or be out of
            date, so consider uninstalling it.
          </AlertDescription>
        </Alert>
      ) : null}

      {server.type === "http" ? <AccountCard server={server} /> : null}

      <PermissionsCard server={server} onUpdate={onUpdate} />
      <ConnectionCard key={connectionKey} connection={connection} onUpdate={onUpdate} />

      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Uninstall</ItemTitle>
          <ItemDescription>Remove this extension and its settings from AgentOne.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="destructive" size="sm" onClick={() => setConfirmUninstall(true)}>
            <IconTrash data-icon="inline-start" />
            Uninstall
          </Button>
        </ItemActions>
      </Item>

      <Dialog open={confirmUninstall} onOpenChange={setConfirmUninstall}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall {server.name}?</DialogTitle>
            <DialogDescription>
              You can install it again later, but its settings will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUninstall(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onUninstall}>
              Uninstall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
