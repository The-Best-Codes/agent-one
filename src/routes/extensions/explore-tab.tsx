import { IconChevronRight, IconCloudOff, IconSearch, IconStar } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRegistrySearch, useRegistrySummaries } from "@/hooks/use-extension-registry";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import { EXTENSION_LIST_LIMIT } from "@/lib/mcp-registry/storage";
import { extensionListStatusAtom, updateExtensionList } from "@/lib/mcp-registry/sync";

import {
  CURATED_EXTENSION_IDS,
  EXTENSION_CATEGORIES,
  FEATURED_EXTENSION_IDS,
  isVerifiedExtension,
} from "./curated";
import { ExtensionCard, ExtensionResult } from "./extension-listing";

interface ExploreTabProps {
  installedIds: Set<string>;
  onInstall: (extension: McpRegistrySummary) => void;
  onManage: (id: string) => void;
  onAddCustom: () => void;
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="flex items-center gap-2 text-lg font-semibold">{title}</h3>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardGrid({
  ids,
  summaries,
  limit,
  ...listing
}: Omit<ExploreTabProps, "onAddCustom"> & {
  ids: string[];
  summaries: Map<string, McpRegistrySummary> | null;
  limit?: number;
}) {
  const extensions = summaries
    ? ids
        .map((id) => summaries.get(id))
        .filter((extension) => extension !== undefined)
        .slice(0, limit)
    : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {extensions
        ? extensions.map((extension) => (
            <ExtensionCard
              key={extension.id}
              extension={extension}
              installed={listing.installedIds.has(extension.id)}
              onInstall={listing.onInstall}
              onManage={listing.onManage}
            />
          ))
        : Array.from({ length: limit ?? 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
    </div>
  );
}

function SearchResults({ query, ...props }: ExploreTabProps & { query: string }) {
  const { extensions, hasMore, isSearching, error } = useRegistrySearch(query);
  const sorted = useMemo(
    () =>
      [...extensions].sort(
        (a, b) => Number(isVerifiedExtension(b.id)) - Number(isVerifiedExtension(a.id)),
      ),
    [extensions],
  );

  if (isSearching && sorted.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-lg" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconSearch />
          </EmptyMedia>
          <EmptyTitle>
            {error ? "Search isn't working right now" : "No extensions found"}
          </EmptyTitle>
          <EmptyDescription>
            {error
              ? "The extension list couldn't be searched. Try again in a moment."
              : "Try different words, or add your own custom extension."}
          </EmptyDescription>
        </EmptyHeader>
        {error ? null : (
          <EmptyContent>
            <Button variant="outline" onClick={props.onAddCustom}>
              Add custom extension
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={isSearching}>
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        {hasMore ? `${EXTENSION_LIST_LIMIT}+ results` : `${sorted.length} results`}
        {isSearching ? <Spinner /> : null}
      </p>
      {sorted.map((extension) => (
        <ExtensionResult
          key={extension.id}
          extension={extension}
          installed={props.installedIds.has(extension.id)}
          onInstall={props.onInstall}
          onManage={props.onManage}
        />
      ))}
      {hasMore ? (
        <p className="text-muted-foreground py-2 text-center text-sm">
          Showing the top {EXTENSION_LIST_LIMIT} results. Try a more specific search to see others.
        </p>
      ) : null}
    </div>
  );
}

function ListUnavailable() {
  const status = useAtomValue(extensionListStatusAtom);

  if (status.isUpdating || !status.isStartupComplete) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>Getting extensions ready</EmptyTitle>
          <EmptyDescription>
            {status.processedCount > 0
              ? `Downloaded ${status.processedCount.toLocaleString()} extensions so far...`
              : "Downloading the latest list of extensions..."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCloudOff />
        </EmptyMedia>
        <EmptyTitle>Extensions aren't available yet</EmptyTitle>
        <EmptyDescription>
          Connect to the internet and try again to download the list of extensions.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={() => void updateExtensionList()}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function ExploreTab(props: ExploreTabProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const status = useAtomValue(extensionListStatusAtom);
  const summaries = useRegistrySummaries(CURATED_EXTENSION_IDS);
  const category = EXTENSION_CATEGORIES.find((item) => item.id === categoryId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold">Explore extensions</h2>
        <p className="text-muted-foreground text-sm">
          Extensions connect AgentOne to the apps and services you use.
        </p>
      </div>

      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search thousands of extensions..."
        aria-label="Search extensions"
        className="h-10"
        autoFocus
      />

      {!status.hasDownloadedList ? (
        <ListUnavailable />
      ) : query.trim() ? (
        <SearchResults query={query} {...props} />
      ) : (
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={2}
            className="flex-wrap"
            value={categoryId}
            onValueChange={(value) => setCategoryId(value || "all")}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            {EXTENSION_CATEGORIES.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id}>
                <item.icon />
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {category ? (
            <Section title={category.label} description={category.description}>
              <CardGrid ids={category.extensionIds} summaries={summaries} {...props} />
            </Section>
          ) : (
            <>
              <Section
                title={
                  <>
                    <IconStar className="size-5" />
                    Featured
                  </>
                }
                description="Hand-picked by AgentOne to help you get started"
              >
                <CardGrid ids={FEATURED_EXTENSION_IDS} summaries={summaries} {...props} />
              </Section>
              {EXTENSION_CATEGORIES.map((item) => (
                <Section
                  key={item.id}
                  title={item.label}
                  description={item.description}
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setCategoryId(item.id)}>
                      See all
                      <IconChevronRight data-icon="inline-end" />
                    </Button>
                  }
                >
                  <CardGrid ids={item.extensionIds} summaries={summaries} limit={3} {...props} />
                </Section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
