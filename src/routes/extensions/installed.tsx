import { IconArrowUpRight, IconPuzzle } from "@tabler/icons-react";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { ExternalLink } from "@/components/a1/external-link";
import { SearchInput } from "@/components/a1/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AGENT_ONE_EXTENSIONS_URL } from "@/lib/constants";
import { getExtensionSourceLabel, getInstalledExtensionMetadata } from "@/lib/extensions/metadata";

import { ExtensionIcon } from "./components/extension-icon";
import { ServerStatusDot } from "./components/server-status";
import { getExtensionPath, getServerStatus, useExtensionsLink } from "./model";
import { useExtensionActions } from "./use-extension-actions";

const SEARCH_THRESHOLD = 6;

function FindExtensionsButton({ variant }: { variant?: "default" | "outline" }) {
  return (
    <Button asChild variant={variant} className="shrink-0">
      <ExternalLink href={AGENT_ONE_EXTENSIONS_URL}>
        Find extensions
        <IconArrowUpRight data-icon="inline-end" />
      </ExternalLink>
    </Button>
  );
}

export default function InstalledRoute() {
  const link = useExtensionsLink();
  const { servers, loadStates, authStates, updateServer } = useExtensionActions();
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

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <IconPuzzle className="text-muted-foreground size-12" />
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">No extensions installed</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            Extensions connect AgentOne to the apps you use. Find one on the AgentOne website and
            install it in a click, or add your own with Add custom.
          </p>
        </div>
        <FindExtensionsButton />
      </div>
    );
  }

  return (
    <>
      {rows.length >= SEARCH_THRESHOLD ? (
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search installed extensions"
          aria-label="Search installed extensions"
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          {rows.length === 1 ? "1 extension installed" : `${rows.length} extensions installed`}
        </p>
      )}

      {visible.length ? (
        <ul className="flex flex-col gap-2">
          {visible.map((row) => {
            const { server } = row;
            const status = getServerStatus(
              loadStates[server.id],
              authStates[server.id],
              server.enabled,
            );
            return (
              <li
                key={server.id}
                className="bg-muted/40 hover:bg-muted/80 flex items-center gap-3 rounded-xl pr-4 transition-colors not-dark:border"
              >
                <Link
                  to={link(getExtensionPath(server.id))}
                  className="focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-xl py-3 pl-4 outline-none focus-visible:ring-3"
                >
                  <ExtensionIcon name={row.name} src={row.iconUrl} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{row.name}</span>
                      {row.source ? (
                        <Badge variant="outline" className="shrink-0">
                          {row.source}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground truncate text-sm">{row.description}</p>
                  </div>
                  <span
                    className="text-muted-foreground flex max-w-40 shrink-0 items-center gap-1.5 text-xs"
                    title={status.description}
                  >
                    <ServerStatusDot tone={status.tone} />
                    <span className="truncate not-sm:sr-only">{status.label}</span>
                  </span>
                </Link>
                <Switch
                  checked={server.enabled}
                  aria-label={`Turn ${row.name} on or off`}
                  onCheckedChange={(enabled) => updateServer(server.id, { enabled })}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No installed extensions match your search.
        </p>
      )}

      <div className="bg-muted/40 flex flex-col gap-3 rounded-xl p-4 not-dark:border sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-medium">Looking for more?</p>
          <p className="text-muted-foreground text-sm">
            Browse thousands of extensions on the AgentOne website and install any of them in a
            click.
          </p>
        </div>
        <FindExtensionsButton variant="outline" />
      </div>
    </>
  );
}
