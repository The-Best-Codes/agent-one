import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";

import { useTools } from "@/contexts/use-tools/tools-hooks";
import { mcpServerLoadStatesAtom, mcpServersAtom } from "@/lib/jotai/mcp-atoms";
import { type McpServerConfig } from "@/lib/settings/types";

export function useInstalledExtensions() {
  const [servers, setServers] = useAtom(mcpServersAtom);
  const loadStates = useAtomValue(mcpServerLoadStatesAtom);
  const { restartMcpServer } = useTools();

  const installedIds = useMemo(() => new Set(servers.map((server) => server.id)), [servers]);

  const addServer = useCallback(
    (server: McpServerConfig) => setServers((previous) => [server, ...previous]),
    [setServers],
  );

  const updateServer = useCallback(
    (serverId: string, updates: Partial<McpServerConfig>) => {
      const current = servers.find((server) => server.id === serverId);
      const shouldRetry =
        current !== undefined &&
        loadStates[serverId]?.status === "error" &&
        updates.timeoutMs !== undefined &&
        updates.timeoutMs !== current.timeoutMs;

      setServers((previous) =>
        previous.map((server) =>
          server.id === serverId ? ({ ...server, ...updates } as McpServerConfig) : server,
        ),
      );

      if (shouldRetry) restartMcpServer(serverId);
    },
    [servers, loadStates, restartMcpServer, setServers],
  );

  const removeServer = useCallback(
    (serverId: string) =>
      setServers((previous) => previous.filter((server) => server.id !== serverId)),
    [setServers],
  );

  return { servers, installedIds, addServer, updateServer, removeServer, restartMcpServer };
}
