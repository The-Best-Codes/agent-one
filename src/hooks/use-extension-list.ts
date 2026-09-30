import fuzzysort from "fuzzysort";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

import { mcpServersAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import type { McpRegistrySummary } from "@/lib/mcp-registry/install";
import {
  createInstalledRegistryMetadata,
  getInstalledRegistryMetadata,
  getInstalledRegistryName,
} from "@/lib/mcp-registry/metadata";
import {
  EXTENSION_LIST_LIMIT,
  getRegistrySummaries,
  searchRegistry,
} from "@/lib/mcp-registry/storage";
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
  const setServers = useSetAtom(mcpServersAtom);
  const [result, setResult] = useState({
    extensions: [] as McpRegistrySummary[],
    installedIds: [] as string[],
    knownRegistryNames: new Set<string>(),
    hasMore: false,
    resetKey: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        setIsSearching(true);
        void (async () => {
          const installedNames = servers
            .map(getInstalledRegistryName)
            .filter((name): name is string => name !== null);
          let extensions: McpRegistrySummary[] = [];
          let installedSummaries: McpRegistrySummary[] = [];
          let queryError = "";
          try {
            [extensions, installedSummaries] = await Promise.all([
              onlyInstalled
                ? Promise.resolve([])
                : searchRegistry({
                    query,
                    showDeviceExtensions,
                    showOnlineExtensions,
                    installedNames,
                  }),
              getRegistrySummaries(installedNames),
            ]);
          } catch (error) {
            logger.warn("Failed to search extension list", error);
            queryError =
              "The extension list could not be loaded. Installed extensions are still available.";
          }
          if (cancelled) return;
          const summaries = new Map(
            installedSummaries.map((summary) => [summary.registryName, summary]),
          );
          const installed = servers
            .filter((server) =>
              server.type === "stdio" ? showDeviceExtensions : showOnlineExtensions,
            )
            .map((server) => {
              const name = getInstalledRegistryName(server);
              const metadata = getInstalledRegistryMetadata(server);
              const summary = name ? summaries.get(name) : undefined;
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
          setResult((previous) => ({
            extensions: (queryError && !onlyInstalled ? previous.extensions : extensions).slice(
              0,
              Math.max(0, EXTENSION_LIST_LIMIT - installed.length),
            ),
            installedIds: installed.slice(0, EXTENSION_LIST_LIMIT).map((item) => item.id),
            resetKey: JSON.stringify([
              query,
              onlyInstalled,
              showDeviceExtensions,
              showOnlineExtensions,
            ]),
            knownRegistryNames: new Set(installedSummaries.map((summary) => summary.registryName)),
            hasMore: queryError
              ? previous.hasMore
              : installed.length + extensions.length > EXTENSION_LIST_LIMIT,
          }));
          setError(queryError);
          const missingMetadata = servers.some((server) => {
            const name = getInstalledRegistryName(server);
            return !getInstalledRegistryMetadata(server) && name !== null && summaries.has(name);
          });
          if (missingMetadata) {
            setServers((current) =>
              current.map((server) => {
                const name = getInstalledRegistryName(server);
                const summary = name ? summaries.get(name) : undefined;
                return summary && !getInstalledRegistryMetadata(server)
                  ? {
                      ...server,
                      registryMetadata: {
                        ...createInstalledRegistryMetadata(summary),
                        version: server.id.includes("@")
                          ? server.id.slice(server.id.lastIndexOf("@") + 1)
                          : summary.version,
                      },
                    }
                  : server;
              }),
            );
          }
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
  }, [
    servers,
    query,
    onlyInstalled,
    showDeviceExtensions,
    showOnlineExtensions,
    revision,
    setServers,
  ]);

  return { ...result, isSearching, error };
}
