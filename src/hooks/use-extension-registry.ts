import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { getLogger } from "@/lib/logger";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import { getRegistrySummaries, searchRegistry } from "@/lib/mcp-registry/storage";
import { extensionListRevisionAtom } from "@/lib/mcp-registry/sync";

const logger = getLogger(import.meta.url);

export function useRegistrySummaries(ids: string[]) {
  const revision = useAtomValue(extensionListRevisionAtom);
  const [summaries, setSummaries] = useState<Map<string, McpRegistrySummary> | null>(null);
  const idsKey = JSON.stringify(ids);

  useEffect(() => {
    let cancelled = false;
    getRegistrySummaries(JSON.parse(idsKey) as string[])
      .then((result) => {
        if (!cancelled) setSummaries(new Map(result.map((summary) => [summary.id, summary])));
      })
      .catch((error) => {
        logger.warn("Failed to load extension summaries", error);
        if (!cancelled) setSummaries(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, revision]);

  return summaries;
}

export function useRegistrySearch(query: string) {
  const revision = useAtomValue(extensionListRevisionAtom);
  const [result, setResult] = useState({
    query: "",
    extensions: [] as McpRegistrySummary[],
    hasMore: false,
    error: false,
  });
  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchRegistry({ query: trimmed, showDeviceExtensions: true, showOnlineExtensions: true })
        .then(({ extensions, hasMore }) => {
          if (!cancelled) setResult({ query: trimmed, extensions, hasMore, error: false });
        })
        .catch((error) => {
          logger.warn("Failed to search extension list", error);
          if (!cancelled)
            setResult({ query: trimmed, extensions: [], hasMore: false, error: true });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, revision]);

  return { ...result, isSearching: result.query !== trimmed };
}
