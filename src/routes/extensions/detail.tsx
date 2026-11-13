import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowUpRight,
  IconPuzzleOff,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ExternalLink } from "@/components/a1/external-link";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getExtensionPageUrl } from "@/lib/extensions/manifest";
import { getExtensionSourceLabel, getInstalledExtensionMetadata } from "@/lib/extensions/metadata";
import type { McpServerConfig } from "@/lib/settings/types";

import { ExtensionIcon } from "./components/extension-icon";
import { ExtensionSettings } from "./components/extension-settings";
import { ServerStatusDot } from "./components/server-status";
import { getServerStatus, useExtensionsLink } from "./model";
import { UninstallExtensionDialog } from "./uninstall-extension-dialog";
import { useExtensionActions } from "./use-extension-actions";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="min-w-0 text-sm font-medium wrap-anywhere">{children}</dd>
    </div>
  );
}

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <ExternalLink
      href={href}
      className="hover:text-primary inline-flex max-w-full items-center gap-0.5 underline underline-offset-4"
    >
      <span className="truncate">{children}</span>
      <IconArrowUpRight className="size-3.5 shrink-0" />
    </ExternalLink>
  );
}

function ExtensionDetail({ server }: { server: McpServerConfig }) {
  const navigate = useNavigate();
  const link = useExtensionsLink();
  const { loadStates, authStates, removeServers, restartServer } = useExtensionActions();
  const [showUninstall, setShowUninstall] = useState(false);

  const metadata = getInstalledExtensionMetadata(server);
  const name = server.name || metadata?.displayName || "Custom extension";
  const tagline = metadata?.description;
  const pageUrl = getExtensionPageUrl(server);
  const isWebsite = /^https?:\/\//i.test(metadata?.websiteUrl ?? "");
  const source = getExtensionSourceLabel(metadata);
  const status = getServerStatus(loadStates[server.id], authStates[server.id], server.enabled);

  return (
    <>
      <header className="flex items-start gap-3">
        {metadata?.iconUrl ? <ExtensionIcon name={name} src={metadata.iconUrl} size="lg" /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 text-xl leading-6 font-semibold wrap-anywhere">{name}</h2>
            {source ? <Badge variant="outline">{source}</Badge> : null}
          </div>
          <div
            className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm leading-4"
            title={status.description}
          >
            <ServerStatusDot tone={status.tone} />
            <span className="truncate">
              {status.tone === "error" ? status.label : `${status.label} · ${status.description}`}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-center">
          {server.enabled && status.tone !== "loading" ? (
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Restart extension"
                  onClick={() => restartServer(server.id)}
                >
                  <IconRefresh />
                </Button>
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent>Restart</AdaptiveTooltipContent>
            </AdaptiveTooltip>
          ) : null}
          <Button
            variant="destructive"
            size="sm"
            className="not-sm:size-7 not-sm:px-0!"
            onClick={() => setShowUninstall(true)}
          >
            <IconTrash data-icon="inline-start" />
            <span className="sr-only sm:not-sr-only">Uninstall</span>
          </Button>
        </div>
      </header>

      {status.tone === "error" ? (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertTitle>This extension couldn't load</AlertTitle>
          <AlertDescription className="wrap-anywhere">Error: {status.description}</AlertDescription>
        </Alert>
      ) : null}

      <ExtensionSettings
        server={server}
        about={
          metadata || pageUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
                {tagline ? (
                  <CardDescription className="wrap-anywhere">{tagline}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {metadata?.author ? (
                    <Fact label="Made by">
                      {isWebsite && metadata.websiteUrl ? (
                        <OutLink href={metadata.websiteUrl}>{metadata.author}</OutLink>
                      ) : (
                        metadata.author
                      )}
                    </Fact>
                  ) : null}
                  {metadata?.version ? <Fact label="Version">{metadata.version}</Fact> : null}
                  {metadata?.badges.length ? (
                    <Fact label="Categories">
                      <span className="flex flex-wrap gap-1.5">
                        {metadata.badges.map((badge) => (
                          <Badge key={badge} variant="outline" className="max-w-full">
                            <span className="truncate">{badge}</span>
                          </Badge>
                        ))}
                      </span>
                    </Fact>
                  ) : null}
                  {pageUrl || (isWebsite && !metadata?.author) ? (
                    <Fact label="More info">
                      <span className="flex flex-col items-start gap-1">
                        {pageUrl ? <OutLink href={pageUrl}>View on agent-one.dev</OutLink> : null}
                        {isWebsite && !metadata?.author && metadata?.websiteUrl ? (
                          <OutLink href={metadata.websiteUrl}>Website</OutLink>
                        ) : null}
                      </span>
                    </Fact>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          ) : null
        }
      />

      <UninstallExtensionDialog
        serverName={name}
        open={showUninstall}
        onOpenChange={setShowUninstall}
        onCancel={() => setShowUninstall(false)}
        onConfirm={() => {
          removeServers([server.id]);
          toast.success(`${name} removed`);
          setShowUninstall(false);
          void navigate(link("/extensions"), { replace: true });
        }}
      />
    </>
  );
}

export default function ExtensionDetailRoute() {
  const serverId = useParams()["*"];
  const link = useExtensionsLink();
  const { servers } = useExtensionActions();
  if (!serverId) return <Navigate replace to={link("/extensions")} />;
  const server = servers.find((item) => item.id === serverId);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link to={link("/extensions")}>
          <IconArrowLeft data-icon="inline-start" />
          All extensions
        </Link>
      </Button>
      {server ? (
        <ExtensionDetail key={server.id} server={server} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPuzzleOff />
            </EmptyMedia>
            <EmptyTitle>Extension not found</EmptyTitle>
            <EmptyDescription>
              This extension isn't installed anymore, or the link is incorrect.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}
