import { IconBulb, IconPlus, IconPuzzle, IconSettings } from "@tabler/icons-react";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router";

import { ExternalLink } from "@/components/a1/external-link";
import { SearchInput } from "@/components/a1/search-input";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Switch } from "@/components/ui/switch";
import { AGENT_ONE_EXTENSIONS_URL } from "@/lib/constants";
import { getExtensionSourceLabel, getInstalledExtensionMetadata } from "@/lib/extensions/metadata";

import { ExtensionIcon } from "./components/extension-icon";
import { ServerStatusDot } from "./components/server-status";
import { getExtensionPath, getServerStatus, useExtensionsLink } from "./model";
import { useExtensionActions } from "./use-extension-actions";

export default function InstalledRoute() {
  const link = useExtensionsLink();
  const { servers, loadStates, authStates, updateServer } = useExtensionActions();
  const openAddDialog = useOutletContext<() => void>();
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      servers.map((server) => {
        const metadata = getInstalledExtensionMetadata(server);
        return {
          server,
          name: server.name || metadata?.displayName || "Custom extension",
          description:
            metadata?.description || (server.type === "stdio" ? server.command : server.url),
          iconUrl: metadata?.iconUrl,
          source: getExtensionSourceLabel(metadata),
        };
      }),
    [servers],
  );

  const text = query.trim();
  const visible = text
    ? rows
        .map((row) => ({
          row,
          score:
            fuzzysort.single(text, `${row.name} ${row.description} ${row.server.id}`)?.score ?? 0,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.row)
    : rows;

  return (
    <>
      <Alert>
        <IconBulb />
        <AlertTitle>Find more extensions</AlertTitle>
        <AlertDescription>
          Browse the <ExternalLink href={AGENT_ONE_EXTENSIONS_URL}>AgentOne website</ExternalLink>{" "}
          to find extensions and install any of them in a click.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search installed extensions"
          aria-label="Search installed extensions"
          containerClassName="flex-1"
        />
        <Button onClick={openAddDialog}>
          <IconPlus data-icon="inline-start" />
          Add Custom
        </Button>
      </div>

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPuzzle />
            </EmptyMedia>
            <EmptyTitle>{text ? "No matching extensions" : "No extensions installed"}</EmptyTitle>
            <EmptyDescription>
              {text
                ? "Try a different search."
                : "Extensions connect AgentOne to the apps you use. Find one on the AgentOne website, or add your own."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="rounded-md border px-2">
          {visible.map((row) => {
            const { server } = row;
            const status = getServerStatus(
              loadStates[server.id],
              authStates[server.id],
              server.enabled,
            );
            return (
              <li key={server.id} className="flex items-center gap-2 px-1 py-2 not-last:border-b">
                <Link
                  to={link(getExtensionPath(server.id))}
                  className="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none focus-visible:ring-[3px]"
                >
                  <ExtensionIcon name={row.name} src={row.iconUrl} className="size-9" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">{row.name}</span>
                      {row.source ? (
                        <Badge variant="outline" className="not-sm:hidden">
                          {row.source}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {row.description}
                    </span>
                  </span>
                </Link>
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
                      <ServerStatusDot tone={status.tone} />
                      <span className="not-sm:sr-only">{status.label}</span>
                    </span>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent className="max-w-xs wrap-anywhere">
                    {status.description}
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
                <Button asChild variant="outline" size="icon-xs">
                  <Link to={link(getExtensionPath(server.id))} aria-label={`Configure ${row.name}`}>
                    <IconSettings />
                  </Link>
                </Button>
                <Switch
                  checked={server.enabled}
                  aria-label={`Turn ${row.name} on or off`}
                  onCheckedChange={(enabled) => updateServer(server.id, { enabled })}
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
