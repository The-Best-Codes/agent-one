import {
  IconChevronRight,
  IconExternalLink,
  IconPackage,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cloneElement, isValidElement, memo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import i18n from "@/lib/i18n";
import { type McpAuthState, type McpServerLoadState } from "@/lib/jotai/mcp-atoms";

import { McpServerStatus } from "./mcp-server-status";

function getMcpServerStatusTooltip(
  state?: McpServerLoadState,
  authState?: McpAuthState,
  disabled?: boolean,
): string {
  if (disabled) {
    return i18n.t("common.disabled");
  }

  if (state?.status === "error" && (authState === "logged-out" || authState === "supports-oauth")) {
    return authState === "supports-oauth"
      ? i18n.t("extensions.loginAvailable")
      : i18n.t("extensions.authRequired");
  }

  switch (state?.status) {
    case "loaded":
      if (state.toolCount === 0) {
        return i18n.t("extensions.connectedNoTools");
      }
      return state.toolCount === 1
        ? i18n.t("extensions.loadedOneTool")
        : i18n.t("extensions.loadedTools", { count: state.toolCount });
    case "error":
      return state.error
        ? i18n.t("extensions.errorWithMessage", { error: state.error })
        : i18n.t("common.error");
    case "starting":
      return i18n.t("extensions.starting");
    case "connecting":
      return i18n.t("extensions.connecting");
    case "disabled":
      return i18n.t("common.disabled");
    case "unknown":
    default:
      return i18n.t("common.unknown");
  }
}

interface ExtensionListRowProps {
  title: string;
  description: string;
  version?: string;
  iconUrl?: string;
  websiteUrl?: string;
  badges?: string[];
  installed: boolean;
  installSupported?: boolean;
  canUninstall?: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
  enabled?: boolean;
  loadState?: McpServerLoadState;
  authState?: McpAuthState;
  onEnabledChange?: (enabled: boolean) => void;
  onRestart?: () => void;
  advancedContent?: ReactNode;
  advancedContentKey?: unknown;
  moreInfoJson?: unknown;
}

function ExtensionListRowComponent({
  title,
  description,
  version,
  iconUrl,
  websiteUrl,
  badges = [],
  installed,
  installSupported = true,
  canUninstall = true,
  onInstall,
  onUninstall,
  enabled,
  loadState,
  authState,
  onEnabledChange,
  onRestart,
  advancedContent,
  moreInfoJson,
}: ExtensionListRowProps) {
  const { t } = useTranslation();
  const hasAdvanced = Boolean(advancedContent) || moreInfoJson !== undefined;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFooter, setAdvancedFooter] = useState<ReactNode>(null);
  const toolCount = loadState?.status === "loaded" ? loadState.toolCount : null;
  const advancedBody = isValidElement<{
    setDialogFooter?: (footer: ReactNode) => void;
  }>(advancedContent)
    ? cloneElement(advancedContent, { setDialogFooter: setAdvancedFooter })
    : advancedContent;

  return (
    <div className="bg-muted/40 flex w-full flex-col gap-3 rounded-md p-4 not-dark:border">
      <div className="flex w-full items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="flex min-w-0 items-center gap-2 truncate text-lg font-medium">
              <Avatar className="size-6">
                <AvatarImage src={iconUrl} alt={t("extensions.iconAlt", { title })} />
                <AvatarFallback>
                  <IconPackage />
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{title}</span>
            </p>
            {version ? <Badge variant="outline">v{version}</Badge> : null}
          </div>

          <div className="flex flex-col">
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full min-w-0 cursor-pointer items-center gap-1 self-start text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <span className="truncate">{websiteUrl}</span>
                <IconExternalLink className="size-3.5 shrink-0" />
              </a>
            ) : null}
            <p className="text-muted-foreground line-clamp-2 text-xs">{description}</p>
          </div>

          {badges.length > 0 ? (
            <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
              {badges.slice(0, 2).map((tag) => (
                <Badge key={`${title}-${tag}`} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {installed && canUninstall ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onUninstall}
              className="not-sm:size-7 sm:pl-1.5"
            >
              <IconTrash />
              <span className="sr-only sm:not-sr-only">{t("extensions.uninstall")}</span>
            </Button>
          ) : !installed ? (
            <Button size="sm" variant="default" onClick={onInstall} disabled={!installSupported}>
              {installSupported ? t("extensions.installAction") : t("extensions.unsupported")}
            </Button>
          ) : null}
          {installed && enabled !== undefined && onEnabledChange ? (
            <div className="bg-muted dark:bg-input/30 border-border flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem]">
              {enabled &&
              onRestart &&
              loadState?.status !== "starting" &&
              loadState?.status !== "connecting" ? (
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-3"
                      aria-label={t("extensions.restartAria")}
                      onClick={onRestart}
                    >
                      <IconRefresh />
                    </Button>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent>{t("extensions.restart")}</AdaptiveTooltipContent>
                </AdaptiveTooltip>
              ) : null}
              <AdaptiveTooltip>
                <AdaptiveTooltipTrigger asChild>
                  <div className="flex items-center">
                    <McpServerStatus
                      state={loadState}
                      authState={authState}
                      disabled={!enabled}
                      compact
                    />
                  </div>
                </AdaptiveTooltipTrigger>
                <AdaptiveTooltipContent>
                  {getMcpServerStatusTooltip(loadState, authState, !enabled)}
                </AdaptiveTooltipContent>
              </AdaptiveTooltip>
              {toolCount !== null ? (
                <span className="text-muted-foreground text-xs">
                  {t("extensions.toolCount", { count: toolCount })}
                </span>
              ) : null}

              <Switch
                size="sm"
                className="ml-1"
                checked={enabled}
                onCheckedChange={onEnabledChange}
                aria-label={t("extensions.toggleExtension")}
              />
            </div>
          ) : null}
        </div>
      </div>

      {installed && hasAdvanced ? (
        <Dialog
          open={advancedOpen}
          onOpenChange={(open) => {
            setAdvancedOpen(open);
            if (!open) {
              setAdvancedFooter(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-between rounded-md border px-3 py-2 text-sm font-medium"
            >
              {t("extensions.advanced")}
              <IconChevronRight className="text-muted-foreground" data-icon="inline-end" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("extensions.advancedConfig", { title })}</DialogTitle>
              <DialogDescription>{t("extensions.editAdvanced")}</DialogDescription>
            </DialogHeader>
            <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
              <div className="flex flex-col gap-4 py-1">
                {advancedBody}
                {moreInfoJson !== undefined ? (
                  <Accordion type="single" collapsible className="rounded-md border px-3">
                    <AccordionItem value="more-info" className="border-b-0">
                      <AccordionTrigger className="py-3">
                        {t("extensions.debugInfo")}
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="bg-muted overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                          {JSON.stringify(moreInfoJson, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : null}
              </div>
            </div>
            {advancedFooter ? <DialogFooter>{advancedFooter}</DialogFooter> : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

export const ExtensionListRow = memo(ExtensionListRowComponent, (previous, next) => {
  return (
    previous.title === next.title &&
    previous.description === next.description &&
    previous.version === next.version &&
    previous.iconUrl === next.iconUrl &&
    previous.websiteUrl === next.websiteUrl &&
    previous.badges === next.badges &&
    previous.installed === next.installed &&
    previous.installSupported === next.installSupported &&
    previous.canUninstall === next.canUninstall &&
    previous.enabled === next.enabled &&
    previous.loadState === next.loadState &&
    previous.authState === next.authState &&
    previous.advancedContentKey === next.advancedContentKey &&
    previous.moreInfoJson === next.moreInfoJson
  );
});
