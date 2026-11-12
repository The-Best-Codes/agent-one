import { IconLogin, IconLogout, IconRefresh } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { mcpCheckAuth, mcpLogin, mcpLogout } from "@/lib/ai/tools/mcp/oauth";
import type { McpAuthState, McpServerLoadState } from "@/lib/jotai/mcp-atoms";
import type { McpHttpServerConfig, McpServerConfig } from "@/lib/settings/types";

import { McpServerConfigForm } from "../mcp-server-config-form";
import { getServerStatus } from "../model";
import { useExtensionActions } from "../use-extension-actions";
import { ServerStatusDot } from "./server-status";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-3">{children}</div>;
}

function RowText({ title, description }: { title: React.ReactNode; description?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-2 text-sm font-medium">{title}</span>
      {description ? (
        <span className="text-muted-foreground line-clamp-3 text-xs wrap-anywhere">
          {description}
        </span>
      ) : null}
    </div>
  );
}

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
    <Row>
      <RowText
        title="Account"
        description={
          authState === undefined
            ? "Checking sign-in status..."
            : authState === "logged-in"
              ? "Connected"
              : authState === "supports-oauth"
                ? "Connect your account for full access"
                : "Not connected"
        }
      />
      {authState === undefined ? (
        <Spinner className="text-muted-foreground shrink-0" />
      ) : authState === "logged-in" ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={busy}
          onClick={() => run(() => mcpLogout(server.id, server.name))}
        >
          {busy ? <Spinner data-icon="inline-start" /> : <IconLogout data-icon="inline-start" />}
          Disconnect
        </Button>
      ) : (
        <Button
          size="sm"
          className="shrink-0"
          disabled={busy}
          onClick={() => run(() => mcpLogin(server.id, server.url, server.name))}
        >
          {busy ? <Spinner data-icon="inline-start" /> : <IconLogin data-icon="inline-start" />}
          Connect
        </Button>
      )}
    </Row>
  );
}

function ToolApprovals({
  server,
  loadState,
  onChange,
}: {
  server: McpServerConfig;
  loadState: McpServerLoadState | undefined;
  onChange: (overrides: Record<string, boolean>) => void;
}) {
  const tools = loadState?.tools ?? [];
  if (!server.enabled) {
    return (
      <p className="text-muted-foreground text-sm">
        Turn this extension on to set approvals per tool.
      </p>
    );
  }
  if (loadState?.status === "error") {
    return (
      <p className="text-muted-foreground text-sm">
        Tools couldn't be loaded. Fix the error above to set approvals per tool.
      </p>
    );
  }
  if (loadState?.status !== "loaded") {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner className="size-4" />
        Tools will appear once the extension finishes loading.
      </p>
    );
  }
  if (!tools.length) {
    return <p className="text-muted-foreground text-sm">This extension has no tools right now.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {tools.map((tool) => {
        const displayName = getToolDisplayName(tool.name, tool.title);
        const override = server.toolApprovalOverrides?.[tool.name];
        const requiresApproval = override ?? server.requiresApproval;
        return (
          <div key={tool.name} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{displayName}</span>
              <span className="text-muted-foreground text-xs">
                {override === undefined
                  ? "Using default"
                  : requiresApproval
                    ? "Always ask"
                    : "Never ask"}
              </span>
            </div>
            <Switch
              size="sm"
              checked={requiresApproval}
              aria-label={`Ask before running ${displayName}`}
              onCheckedChange={(checked) => {
                const next = { ...server.toolApprovalOverrides };
                if (checked === server.requiresApproval) delete next[tool.name];
                else next[tool.name] = checked;
                onChange(next);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function ConnectionForm({
  server,
  onSave,
}: {
  server: McpServerConfig;
  onSave: (updates: Partial<McpServerConfig>) => void;
}) {
  const [draft, setDraft] = useState(server);
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(server);
  const update = (updates: Partial<McpServerConfig>) =>
    setDraft((previous) => ({ ...previous, ...updates }) as McpServerConfig);
  const isValid =
    draft.name.trim() !== "" &&
    draft.timeoutMs >= 100 &&
    (draft.type === "stdio" ? draft.command.trim() !== "" : draft.url.trim() !== "");

  return (
    <div className="flex flex-col gap-4">
      <McpServerConfigForm
        idPrefix={`settings-${server.id}`}
        values={{
          type: draft.type,
          name: draft.name,
          command: draft.type === "stdio" ? draft.command : "",
          env: draft.type === "stdio" ? draft.env : {},
          url: draft.type === "http" ? draft.url : "",
          headers: draft.type === "http" ? draft.headers : {},
          timeoutSec: draft.timeoutMs / 1000,
          requiresApproval: draft.requiresApproval,
        }}
        onChange={(updates) => {
          if (updates.name !== undefined) update({ name: updates.name });
          if (updates.timeoutSec !== undefined) update({ timeoutMs: updates.timeoutSec * 1000 });
          if (draft.type === "stdio") {
            if (updates.command !== undefined) update({ command: updates.command });
            if (updates.env !== undefined) update({ env: updates.env });
          } else {
            if (updates.url !== undefined) update({ url: updates.url });
            if (updates.headers !== undefined) update({ headers: updates.headers });
          }
        }}
      />
      {hasChanges ? (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDraft(server)}>
            Discard
          </Button>
          <Button
            size="sm"
            disabled={!isValid}
            onClick={() =>
              onSave(
                draft.type === "stdio"
                  ? {
                      name: draft.name.trim(),
                      timeoutMs: draft.timeoutMs,
                      command: draft.command.trim(),
                      env: draft.env,
                    }
                  : {
                      name: draft.name.trim(),
                      timeoutMs: draft.timeoutMs,
                      url: draft.url.trim(),
                      headers: draft.headers,
                    },
              )
            }
          >
            Save changes
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ExtensionSettings({ server }: { server: McpServerConfig }) {
  const { loadStates, authStates, updateServer, restartServer } = useExtensionActions();
  const loadState = loadStates[server.id];
  const authState = authStates[server.id];
  const status = getServerStatus(loadState, authState, server.enabled);
  const connectionKey = JSON.stringify([
    server.name,
    server.timeoutMs,
    server.type === "stdio" ? [server.command, server.env] : [server.url, server.headers],
  ]);

  return (
    <section
      aria-label="Extension settings"
      className="bg-muted/40 divide-y rounded-xl not-dark:border"
    >
      <Row>
        <RowText
          title={
            <>
              <ServerStatusDot tone={status.tone} />
              {status.label}
            </>
          }
          description={status.description}
        />
        <div className="flex shrink-0 items-center gap-2">
          {server.enabled && status.tone !== "loading" ? (
            <Button variant="outline" size="sm" onClick={() => restartServer(server.id)}>
              <IconRefresh data-icon="inline-start" />
              Restart
            </Button>
          ) : null}
          <Switch
            checked={server.enabled}
            aria-label="Turn extension on or off"
            onCheckedChange={(enabled) => updateServer(server.id, { enabled })}
          />
        </div>
      </Row>

      {server.type === "http" ? <AccountRow server={server} authState={authState} /> : null}

      <Row>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Label htmlFor={`approval-${server.id}`} className="text-sm font-medium">
            Ask before running tools
          </Label>
          <span className="text-muted-foreground text-xs">
            Asks for confirmation before each tool runs, unless in Auto mode
          </span>
        </div>
        <Switch
          id={`approval-${server.id}`}
          checked={server.requiresApproval}
          onCheckedChange={(requiresApproval) => updateServer(server.id, { requiresApproval })}
        />
      </Row>

      <Accordion type="multiple" className="px-4">
        <AccordionItem value="tools">
          <AccordionTrigger className="py-3 text-sm">Approvals per tool</AccordionTrigger>
          <AccordionContent className="pb-4">
            <ToolApprovals
              server={server}
              loadState={loadState}
              onChange={(toolApprovalOverrides) =>
                updateServer(server.id, { toolApprovalOverrides })
              }
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="connection" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm">Connection settings</AccordionTrigger>
          <AccordionContent className="pb-4">
            <ConnectionForm
              key={connectionKey}
              server={server}
              onSave={(updates) => updateServer(server.id, updates)}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
