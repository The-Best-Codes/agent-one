import { IconArrowLeft, IconArrowUpRight, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ExternalLink } from "@/components/a1/external-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getExtensionPageUrl } from "@/lib/extensions/manifest";
import { getExtensionSourceLabel, getInstalledExtensionMetadata } from "@/lib/extensions/metadata";
import type { McpServerConfig } from "@/lib/settings/types";

import { ExtensionIcon } from "./components/extension-icon";
import { ExtensionSettings } from "./components/extension-settings";
import { useExtensionsLink } from "./model";
import { UninstallExtensionDialog } from "./uninstall-extension-dialog";
import { useExtensionActions } from "./use-extension-actions";

const TOOL_PREVIEW_COUNT = 24;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="min-w-0 text-sm wrap-anywhere">{children}</dd>
    </div>
  );
}

function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <ExternalLink
      href={href}
      className="inline-flex max-w-full items-center gap-0.5 underline underline-offset-2 hover:no-underline"
    >
      <span className="truncate">{children}</span>
      <IconArrowUpRight className="size-3.5 shrink-0" />
    </ExternalLink>
  );
}

function ToolList({ tools }: { tools: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tools : tools.slice(0, TOOL_PREVIEW_COUNT);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Tools</h2>
      <ul className="flex flex-wrap gap-1.5">
        {visible.map((tool) => (
          <li key={tool} className="max-w-full">
            <Badge variant="outline" className="max-w-full font-mono font-normal">
              <span className="truncate">{tool}</span>
            </Badge>
          </li>
        ))}
      </ul>
      {tools.length > TOOL_PREVIEW_COUNT ? (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer" : `Show all ${tools.length} tools`}
        </Button>
      ) : null}
    </section>
  );
}

function ExtensionDetail({ server }: { server: McpServerConfig }) {
  const navigate = useNavigate();
  const link = useExtensionsLink();
  const { loadStates, removeServers } = useExtensionActions();
  const [showUninstall, setShowUninstall] = useState(false);

  const metadata = getInstalledExtensionMetadata(server);
  const name = server.name || metadata?.displayName || "Custom extension";
  const tagline = metadata ? metadata.description : "Custom extension added by you";
  const loadState = loadStates[server.id];
  const tools = loadState?.status === "loaded" ? loadState.toolNames : [];
  const pageUrl = getExtensionPageUrl(server);
  const isWebsite = /^https?:\/\//i.test(metadata?.websiteUrl ?? "");
  const source = getExtensionSourceLabel(metadata);

  return (
    <>
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ExtensionIcon
            name={name}
            src={metadata?.iconUrl}
            className="size-16 rounded-2xl text-2xl"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="min-w-0 text-2xl font-semibold tracking-tight wrap-anywhere">
                {name}
              </h2>
              {source ? <Badge variant="outline">{source}</Badge> : null}
            </div>
            {tagline ? (
              <p className="text-muted-foreground line-clamp-3 text-sm wrap-anywhere">{tagline}</p>
            ) : null}
          </div>
        </div>
        <Button
          variant="destructive"
          className="shrink-0 self-start sm:self-auto"
          onClick={() => setShowUninstall(true)}
        >
          <IconTrash data-icon="inline-start" />
          Uninstall
        </Button>
      </header>

      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <ExtensionSettings server={server} />
          {tools.length ? <ToolList tools={tools} /> : null}
        </div>

        <dl className="flex min-w-0 flex-col gap-5 sm:grid sm:grid-cols-2 lg:flex">
          {metadata?.author ? (
            <Fact label="Made by">
              {isWebsite && metadata.websiteUrl ? (
                <OutLink href={metadata.websiteUrl}>{metadata.author}</OutLink>
              ) : (
                metadata.author
              )}
            </Fact>
          ) : null}
          {metadata?.badges.length ? (
            <Fact label="Categories">
              <span className="flex flex-wrap gap-1.5">
                {metadata.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="max-w-full">
                    <span className="truncate">{badge}</span>
                  </Badge>
                ))}
              </span>
            </Fact>
          ) : null}
          <Fact label="Connection">
            {server.type === "stdio" ? "Runs on this device" : "Connects online"}
          </Fact>
          <Fact label={server.type === "stdio" ? "Command" : "Server URL"}>
            <span className="font-mono text-xs">
              {server.type === "stdio" ? server.command : server.url}
            </span>
          </Fact>
          {metadata?.version ? <Fact label="Version">{metadata.version}</Fact> : null}
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
      </div>

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
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <h2 className="text-base font-semibold">Extension not found</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            This extension isn't installed anymore, or the link is incorrect.
          </p>
        </div>
      )}
    </>
  );
}
