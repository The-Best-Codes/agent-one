import {
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconKey,
  IconLogin,
  IconLogout,
  IconShieldOff,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { mcpCheckAuth, mcpLogin, mcpLogout } from "@/lib/ai/tools/mcp/oauth";
import {
  mcpAuthStatesAtom,
  mcpServerLoadStatesAtom,
  type McpServerLoadState,
} from "@/lib/jotai/mcp-atoms";
import { type McpHttpServerConfig, type McpServerConfig } from "@/lib/settings/types";

import { McpServerConfigForm } from "./mcp-server-config-form";
import { McpServerStatus } from "./mcp-server-status";

function McpAuthStatus({ server, disabled }: { server: McpHttpServerConfig; disabled?: boolean }) {
  const { t } = useTranslation();
  const authStates = useAtomValue(mcpAuthStatesAtom);
  const authState = authStates[server.id];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authState === undefined && !disabled) {
      void mcpCheckAuth(server.id, server.url);
    }
  }, [server.id, server.url, authState, disabled]);

  async function runAuthAction(action: () => Promise<unknown>) {
    setLoading(true);
    await action();
    setLoading(false);
  }

  if (disabled) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <IconInfoCircle className="text-foreground size-5" />
          <span className="text-foreground text-sm">{t("extensions.enableToSeeAuth")}</span>
        </div>
      </div>
    );
  }

  if (authState === "no-auth") {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <IconShieldOff className="text-foreground size-5" />
          <span className="text-foreground text-sm">{t("extensions.noAuthRequired")}</span>
        </div>
      </div>
    );
  }

  if (authState === undefined) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          <Spinner className="text-foreground" data-icon="inline-start" />
          <span className="text-foreground text-sm">{t("extensions.checkingAuth")}</span>
        </div>
      </div>
    );
  }

  const loginLabel =
    authState === "supports-oauth"
      ? t("extensions.connectAccountFullAccess")
      : t("extensions.notConnected");

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        {authState === "logged-in" ? (
          <>
            <IconCircleCheck className="text-foreground size-5" />
            <span className="text-sm">{t("extensions.connected")}</span>
          </>
        ) : authState === "supports-oauth" ? (
          <>
            <IconKey className="text-foreground size-5" />
            <span className="text-foreground text-sm">{loginLabel}</span>
          </>
        ) : (
          <>
            <IconCircleX className="text-foreground size-5" />
            <span className="text-foreground text-sm">{loginLabel}</span>
          </>
        )}
      </div>
      {authState === "logged-in" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => runAuthAction(() => mcpLogout(server.id, server.name))}
          disabled={loading}
        >
          {loading ? <Spinner data-icon="inline-start" /> : <IconLogout />}
          {t("extensions.disconnect")}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => runAuthAction(() => mcpLogin(server.id, server.url, server.name))}
          disabled={loading}
        >
          {loading ? <Spinner data-icon="inline-start" /> : <IconLogin />}
          {t("extensions.connect")}
        </Button>
      )}
    </div>
  );
}

function McpServerApprovalSettings({
  idPrefix,
  enabled,
  requiresApproval,
  toolApprovalOverrides,
  loadState,
  onRequiresApprovalChange,
  onToolApprovalOverridesChange,
}: {
  idPrefix: string;
  enabled: boolean;
  requiresApproval: boolean;
  toolApprovalOverrides?: Record<string, boolean>;
  loadState?: McpServerLoadState;
  onRequiresApprovalChange: (requiresApproval: boolean) => void;
  onToolApprovalOverridesChange: (overrides: Record<string, boolean>) => void;
}) {
  const { t } = useTranslation();
  const availableTools = loadState?.tools ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <Label htmlFor={`${idPrefix}-requires-approval`} className="text-sm">
            {t("extensions.requireApprovalByDefault")}
          </Label>
          <span className="text-muted-foreground text-xs">
            {t("extensions.askBeforeRunningTools")}
          </span>
        </div>
        <Switch
          id={`${idPrefix}-requires-approval`}
          checked={requiresApproval}
          onCheckedChange={onRequiresApprovalChange}
        />
      </div>

      <Accordion type="single" collapsible className="rounded-md border px-3">
        <AccordionItem value="tool-approval" className="border-b-0">
          <AccordionTrigger className="py-3 text-sm">
            {t("extensions.perToolApprovals")}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex flex-col gap-3">
              {!enabled ? (
                <span className="text-muted-foreground text-sm">
                  {t("extensions.enableForPerTool")}
                </span>
              ) : loadState?.status === "starting" ||
                loadState?.status === "connecting" ||
                loadState?.status === "unknown" ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Spinner className="size-4" />
                  {t("extensions.toolListAfterLoad")}
                </div>
              ) : loadState?.status === "error" ? (
                <span className="text-muted-foreground text-sm">
                  {t("extensions.toolsCouldNotLoad")}
                </span>
              ) : availableTools.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  {t("extensions.noToolsExposed")}
                </span>
              ) : (
                availableTools.map((tool) => {
                  const toolName = tool.name;
                  const toolDisplayName = getToolDisplayName(tool.name, tool.title);
                  const override = toolApprovalOverrides?.[toolName];
                  const toolRequiresApproval = override ?? requiresApproval;

                  return (
                    <div key={toolName} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{toolDisplayName}</span>
                        <span className="text-muted-foreground text-xs">
                          {override === undefined
                            ? t("extensions.usingDefaultApproval", {
                                value: requiresApproval
                                  ? t("extensions.approvalRequired")
                                  : t("extensions.noApprovalRequired"),
                              })
                            : toolRequiresApproval
                              ? t("extensions.approvalRequiredCap")
                              : t("extensions.noApprovalRequiredCap")}
                        </span>
                      </div>
                      <Switch
                        checked={toolRequiresApproval}
                        onCheckedChange={(checked) => {
                          const nextOverrides = { ...toolApprovalOverrides };

                          if (checked === requiresApproval) {
                            delete nextOverrides[toolName];
                          } else {
                            nextOverrides[toolName] = checked;
                          }

                          onToolApprovalOverridesChange(nextOverrides);
                        }}
                        aria-label={t("extensions.toggleApproval", { name: toolDisplayName })}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface ExtensionAdvancedDetailsProps {
  server: McpServerConfig;
  onUpdate: (updates: Partial<McpServerConfig>) => void;
  setDialogFooter?: (footer: ReactNode) => void;
}

export function ExtensionAdvancedDetails({
  server,
  onUpdate,
  setDialogFooter,
}: ExtensionAdvancedDetailsProps) {
  const authStates = useAtomValue(mcpAuthStatesAtom);
  const authState = authStates[server.id];
  const loadStates = useAtomValue(mcpServerLoadStatesAtom);
  const loadState = loadStates[server.id];
  const { t } = useTranslation();
  const [draft, setDraft] = useState(server);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(server);
  const updateDraft = (updates: Partial<McpServerConfig>) => {
    setDraft((previous) => ({ ...previous, ...updates }) as McpServerConfig);
  };

  useEffect(() => {
    if (!setDialogFooter) {
      return;
    }

    if (!hasChanges) {
      setDialogFooter(null);
      return;
    }

    setDialogFooter(
      <>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("common.cancel")}
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button type="button" onClick={() => onUpdate(draft)}>
            {t("common.saveChanges")}
          </Button>
        </DialogClose>
      </>,
    );

    return () => {
      setDialogFooter(null);
    };
  }, [draft, hasChanges, onUpdate, setDialogFooter, t]);

  return (
    <div className="flex flex-col gap-3">
      <McpServerStatus
        state={loadState}
        authState={authState}
        disabled={!draft.enabled}
        switchId={`enabled-${server.id}`}
        onEnabledChange={(enabled) => updateDraft({ enabled })}
      />

      <McpServerApprovalSettings
        idPrefix={server.id}
        enabled={draft.enabled}
        requiresApproval={draft.requiresApproval}
        toolApprovalOverrides={draft.toolApprovalOverrides}
        loadState={loadState}
        onRequiresApprovalChange={(requiresApproval) => updateDraft({ requiresApproval })}
        onToolApprovalOverridesChange={(toolApprovalOverrides) =>
          updateDraft({ toolApprovalOverrides })
        }
      />

      <McpServerConfigForm
        idPrefix={server.id}
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
          if (updates.name !== undefined) {
            updateDraft({ name: updates.name });
          }
          if (updates.command !== undefined && draft.type === "stdio") {
            updateDraft({ command: updates.command });
          }
          if (updates.env !== undefined && draft.type === "stdio") {
            updateDraft({ env: updates.env });
          }
          if (updates.url !== undefined && draft.type === "http") {
            updateDraft({ url: updates.url });
          }
          if (updates.headers !== undefined && draft.type === "http") {
            updateDraft({ headers: updates.headers });
          }
          if (updates.timeoutSec !== undefined) {
            updateDraft({ timeoutMs: updates.timeoutSec * 1000 });
          }
        }}
        showApprovalControls={false}
        httpSupplement={
          draft.type === "http" ? <McpAuthStatus server={draft} disabled={!draft.enabled} /> : null
        }
      />
    </div>
  );
}
