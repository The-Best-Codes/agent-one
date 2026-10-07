import { IconChevronRight, IconPlug, IconPlus } from "@tabler/icons-react";
import { useAtomValue } from "jotai";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import { getInstalledRegistryMetadata } from "@/lib/mcp-registry/metadata";
import { type McpServerConfig } from "@/lib/settings/types";

import { ExtensionIcon, ExtensionStatusBadge } from "./extension-listing";
import { getExtensionStatus } from "./extension-status";

interface ManageTabProps {
  servers: McpServerConfig[];
  delistedIds: Set<string>;
  onToggle: (id: string, enabled: boolean) => void;
  onOpen: (id: string) => void;
  onAddCustom: () => void;
  onExplore: () => void;
}

export function ManageTab({
  servers,
  delistedIds,
  onToggle,
  onOpen,
  onAddCustom,
  onExplore,
}: ManageTabProps) {
  const loadStates = useAtomValue(mcpServerLoadStatesAtom);
  const authStates = useAtomValue(mcpAuthStatesAtom);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold">Your extensions</h2>
          <p className="text-muted-foreground text-sm">
            Turn extensions on or off, sign in, and choose what they're allowed to do.
          </p>
        </div>
        <Button variant="outline" onClick={onAddCustom}>
          <IconPlus data-icon="inline-start" />
          Add custom
        </Button>
      </div>

      {servers.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconPlug />
            </EmptyMedia>
            <EmptyTitle>No extensions yet</EmptyTitle>
            <EmptyDescription>
              Extensions let AgentOne work with your favorite apps and services.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onExplore}>Explore extensions</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ItemGroup className="gap-2">
          {servers.map((server) => {
            const metadata = getInstalledRegistryMetadata(server);
            const status = getExtensionStatus(
              server.enabled,
              loadStates[server.id],
              authStates[server.id],
            );
            return (
              <Item key={server.id} variant="outline" role="listitem">
                <ItemMedia>
                  <ExtensionIcon name={server.name} iconUrl={metadata?.iconUrl} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="flex-wrap">
                    {server.name}
                    <ExtensionStatusBadge status={status} />
                    {delistedIds.has(server.id) ? (
                      <Badge variant="outline">No longer listed</Badge>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription className="line-clamp-1">
                    {metadata?.description ??
                      (server.type === "stdio" ? server.command : server.url)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={server.enabled}
                    onCheckedChange={(enabled) => onToggle(server.id, enabled)}
                    aria-label={`Turn ${server.name} on or off`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => onOpen(server.id)}>
                    Details
                    <IconChevronRight data-icon="inline-end" />
                  </Button>
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </div>
  );
}
