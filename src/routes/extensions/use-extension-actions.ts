import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { toast } from "sonner";

import { useTools } from "@/contexts/use-tools/tools-hooks";
import { stopMcpServer } from "@/lib/ai/tools/mcp";
import { setMcpOAuthClient } from "@/lib/ai/tools/mcp/oauth";
import type { ExtensionInstallResult } from "@/lib/extensions/install";
import { isMcpBundleServerId, removeMcpBundle } from "@/lib/extensions/mcpb";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom, mcpServersAtom } from "@/lib/jotai/mcp-atoms";
import { getLogger } from "@/lib/logger";
import type { McpRegistryMetadata, McpServerConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

export function useExtensionActions() {
  const [servers, setServers] = useAtom(mcpServersAtom);
  const loadStates = useAtomValue(mcpServerLoadStatesAtom);
  const authStates = useAtomValue(mcpAuthStatesAtom);
  const { restartMcpServer } = useTools();

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

  const installServer = useCallback(
    (
      installed: ExtensionInstallResult,
      source?: {
        id: string;
        metadata: McpRegistryMetadata;
        installValues?: Record<string, string>;
      },
    ) => {
      const base = {
        id: source?.id ?? crypto.randomUUID(),
        name: installed.name,
        enabled: true,
        timeoutMs: installed.timeoutSec * 1000,
        requiresApproval: installed.requiresApproval,
        toolApprovalOverrides: {},
        registryMetadata: source?.metadata,
        installValues: source?.installValues,
      };
      const server: McpServerConfig =
        installed.type === "stdio"
          ? { ...base, type: "stdio", command: installed.command, env: installed.env }
          : { ...base, type: "http", url: installed.url, headers: installed.headers };
      setServers((previous) => {
        const existing = previous.find((item) => item.id === server.id);
        const next: McpServerConfig = existing
          ? {
              ...server,
              enabled: existing.enabled,
              toolApprovalOverrides: existing.toolApprovalOverrides ?? {},
            }
          : server;
        return [next, ...previous.filter((item) => item.id !== server.id)];
      });
      toast.success(`${installed.name} installed`);
      return server;
    },
    [setServers],
  );

  const removeServers = useCallback(
    (serverIds: string[]) => {
      const ids = new Set(serverIds);
      setServers((previous) => previous.filter((server) => !ids.has(server.id)));
      for (const id of ids) {
        void setMcpOAuthClient(id, "").catch(() => undefined);
        if (isMcpBundleServerId(id)) {
          void stopMcpServer(id)
            .then(() => removeMcpBundle(id))
            .catch((error) => logger.warn("Failed to remove extension files", error));
        }
      }
    },
    [setServers],
  );

  return {
    servers,
    loadStates,
    authStates,
    updateServer,
    installServer,
    removeServers,
    restartServer: restartMcpServer,
  };
}
