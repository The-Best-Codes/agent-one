import { IconPlus, IconPuzzle, IconSearch } from "@tabler/icons-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
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

      {rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPuzzle />
            </EmptyMedia>
            <EmptyTitle>No extensions yet</EmptyTitle>
            <EmptyDescription>
              Extensions give your agent new tools. Find some on the AgentOne website.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <ExternalLink href={AGENT_ONE_EXTENSIONS_URL}>
                <IconSearch data-icon="inline-start" />
                Browse extensions
              </ExternalLink>
            </Button>
          </EmptyContent>
        </Empty>
      ) : text && visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPuzzle />
            </EmptyMedia>
            <EmptyTitle>No matching extensions</EmptyTitle>
            <EmptyDescription>
              Nothing installed matches your search. Try looking for it on the AgentOne website.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <ExternalLink
                href={`${AGENT_ONE_EXTENSIONS_URL}?${new URLSearchParams({ q: text }).toString()}`}
              >
                <IconSearch data-icon="inline-start" />
                Search for new extensions
              </ExternalLink>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {text ? null : (
            <li className="min-w-0">
              <ExternalLink
                href={AGENT_ONE_EXTENSIONS_URL}
                className="group focus-visible:ring-ring/50 flex h-full rounded-xl outline-none focus-visible:ring-3"
              >
                <Empty className="group-hover:bg-muted/50 border p-4 transition-colors">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconPlus />
                    </EmptyMedia>
                    <EmptyTitle>Add extension</EmptyTitle>
                    <EmptyDescription>Find more on the AgentOne website.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </ExternalLink>
            </li>
          )}
          {visible.map((row) => {
            const { server } = row;
            const status = getServerStatus(
              loadStates[server.id],
              authStates[server.id],
              server.enabled,
            );
            const path = link(getExtensionPath(server.id));
            return (
              <li key={server.id} className="min-w-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="min-w-0">
                      <Link
                        to={path}
                        className="group/link focus-visible:ring-ring/50 flex w-fit max-w-full items-center gap-2 rounded-sm outline-none focus-visible:ring-3"
                      >
                        {row.iconUrl ? <ExtensionIcon name={row.name} src={row.iconUrl} /> : null}
                        <span className="truncate text-lg group-hover/link:underline">
                          {row.name}
                        </span>
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 wrap-anywhere">
                      {row.description}
                    </CardDescription>
                    {row.source ? (
                      <CardAction>
                        <Badge variant="outline">{row.source}</Badge>
                      </CardAction>
                    ) : null}
                  </CardHeader>
                  <CardFooter className="mt-auto gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link to={path} aria-label={`Details for ${row.name}`}>
                        Details
                      </Link>
                    </Button>
                    <AdaptiveTooltip>
                      <AdaptiveTooltipTrigger asChild>
                        <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                          <ServerStatusDot tone={status.tone} />
                          <span className="truncate">{status.label}</span>
                        </span>
                      </AdaptiveTooltipTrigger>
                      <AdaptiveTooltipContent className="max-w-xs wrap-anywhere">
                        {status.description}
                      </AdaptiveTooltipContent>
                    </AdaptiveTooltip>
                    <Switch
                      className="ml-auto"
                      checked={server.enabled}
                      aria-label={`Turn ${row.name} on or off`}
                      onCheckedChange={(enabled) => updateServer(server.id, { enabled })}
                    />
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
