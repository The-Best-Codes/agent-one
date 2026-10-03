import fuzzysort from "fuzzysort";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { getLogger } from "@/lib/logger";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import { getInstalledRegistryMetadata } from "@/lib/mcp-registry/metadata";
import { getRegistrySummaries, searchRegistry } from "@/lib/mcp-registry/storage";
import { extensionListRevisionAtom } from "@/lib/mcp-registry/sync";
import type { McpServerConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export function useExtensionList(
  servers: McpServerConfig[],
  query: string,
  onlyInstalled: boolean,
  showDeviceExtensions: boolean,
  showOnlineExtensions: boolean,
) {
  const revision = useAtomValue(extensionListRevisionAtom);
  const [result, setResult] = useState({
    extensions: [] as McpRegistrySummary[],
    installedSummaries: [] as McpRegistrySummary[],
    knownRegistryNames: new Set<string>(),
    hasMore: false,
    resetKey: "",
  });
  const [isSearching, setIsSearching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        setIsSearching(true);
        void (async () => {
          const installedNames = servers
            .filter((server) => getInstalledRegistryMetadata(server) !== undefined)
            .map((server) => server.id);
          let extensions: McpRegistrySummary[] = [];
          let installedSummaries: McpRegistrySummary[] = [];
          let hasMore = false;
          let queryError = "";
          try {
            const [catalog, summaries] = await Promise.all([
              onlyInstalled
                ? Promise.resolve({ extensions: [], hasMore: false })
                : searchRegistry({
                    query,
                    showDeviceExtensions,
                    showOnlineExtensions,
                  }),
              getRegistrySummaries(installedNames),
            ]);
            extensions = catalog.extensions;
            hasMore = catalog.hasMore;
            installedSummaries = summaries;
          } catch (error) {
            logger.warn("Failed to search extension list", error);
            queryError =
              "The extension list could not be loaded. Installed extensions are still available.";
          }
          if (cancelled) return;
          setResult((previous) => ({
            extensions: queryError && !onlyInstalled ? previous.extensions : extensions,
            installedSummaries,
            resetKey: JSON.stringify([
              query,
              onlyInstalled,
              showDeviceExtensions,
              showOnlineExtensions,
            ]),
            knownRegistryNames: new Set(installedSummaries.map((summary) => summary.id)),
            hasMore: queryError ? previous.hasMore : hasMore,
          }));
          setError(queryError);
        })()
          .catch((error) => {
            if (!cancelled) {
              logger.warn("Failed to load extensions", error);
              setError("The extension list could not be loaded.");
            }
          })
          .finally(() => {
            if (!cancelled) setIsSearching(false);
          });
      },
      query.trim() ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [servers, query, onlyInstalled, showDeviceExtensions, showOnlineExtensions, revision]);

  const summaries = new Map(result.installedSummaries.map((summary) => [summary.id, summary]));
  const installed = servers
    .filter((server) => (server.type === "stdio" ? showDeviceExtensions : showOnlineExtensions))
    .map((server) => {
      const metadata = getInstalledRegistryMetadata(server);
      const summary = metadata ? summaries.get(server.id) : undefined;
      const searchText = [
        server.name,
        server.id,
        metadata?.searchText,
        summary?.searchText,
        server.type === "stdio" ? server.command : server.url,
      ]
        .filter(Boolean)
        .join(" ");
      return {
        id: server.id,
        score: query.trim() ? (fuzzysort.single(query.trim(), searchText)?.score ?? 0) : 1,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const installedNames = new Set(
    servers
      .filter((server) => getInstalledRegistryMetadata(server) !== undefined)
      .map((server) => server.id),
  );
  const available = onlyInstalled
    ? []
    : result.extensions.filter((extension) => !installedNames.has(extension.id));

  return {
    extensions: available,
    installedIds: installed.map((item) => item.id),
    knownRegistryNames: result.knownRegistryNames,
    resetKey: result.resetKey,
    hasMore: result.hasMore,
    isSearching,
    error,
  };
}
