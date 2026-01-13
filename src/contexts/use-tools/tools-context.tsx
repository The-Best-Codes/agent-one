import type { ToolSet } from "ai";
import { useAtom } from "jotai";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { staticTools } from "@/lib/ai/tools";
import {
  closeServerCache,
  getCacheVersion,
  getMcpToolsForServer,
  invalidateServerCache,
} from "@/lib/ai/tools/mcp";
import {
  enabledToolsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { type McpServerConfig, type ToolId } from "@/lib/settings/types";

import { ToolsContext } from "./tools-contexts";

const logger = getLogger(import.meta.url);

export interface ToolsContextType {
  getTools: () => Promise<ToolSet>;
  isMcpLoading: boolean;
  mcpLoaded: boolean;
}

interface ToolsProviderProps {
  children: ReactNode;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
  const [enabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);

  const [mcpTools, setMcpTools] = useState<ToolSet>({});
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);

  const mcpToolsRef = useRef<ToolSet>({});
  const mcpLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const previousEnabledServerIdsRef = useRef<Set<string>>(new Set());
  const previousServersHashRef = useRef<string>("");
  const currentVersionRef = useRef(0);

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
  }, [mcpTools, mcpLoaded]);

  useEffect(() => {
    const enabledServers = Array.isArray(mcpServers)
      ? mcpServers.filter((server) => server.enabled)
      : [];

    const serversHash = JSON.stringify(
      enabledServers.map((s) => ({
        id: s.id,
        command: s.command,
        timeout: s.timeoutMs,
      })),
    );

    if (serversHash === previousServersHashRef.current) {
      return;
    }

    previousServersHashRef.current = serversHash;

    const newEnabledServerIds = new Set(enabledServers.map((s) => s.id));
    const previousEnabledServerIds = previousEnabledServerIdsRef.current;

    for (const serverId of previousEnabledServerIds) {
      if (!newEnabledServerIds.has(serverId)) {
        logger.verbose(`Cleaning up disabled server: ${serverId}`);
        closeServerCache(serverId);
      }
    }

    previousEnabledServerIdsRef.current = newEnabledServerIds;
    const version = getCacheVersion();
    currentVersionRef.current = version;

    if (enabledServers.length === 0) {
      invalidateServerCache();
      mcpToolsRef.current = {};
      mcpLoadedRef.current = true;
      setMcpTools({});
      setMcpLoaded(true);
      setIsMcpLoading(false);
      return;
    }

    const loadMcpTools = async () => {
      if (currentVersionRef.current !== version) return;

      // Update refs synchronously before async operations to prevent race conditions
      mcpLoadedRef.current = false;
      setIsMcpLoading(true);
      setMcpLoaded(false);

      try {
        const chunks = [];
        for (let i = 0; i < enabledServers.length; i += parallelLoadLimit) {
          chunks.push(enabledServers.slice(i, i + parallelLoadLimit));
        }

        const allTools: ToolSet = {};

        for (const chunk of chunks) {
          if (currentVersionRef.current !== version) return;

          const promises = chunk.map(async (server: McpServerConfig) => {
            try {
              const tools = await Promise.race([
                getMcpToolsForServer(server),
                new Promise<ToolSet>((_, reject) =>
                  setTimeout(
                    () =>
                      reject(new Error(`Timeout after ${server.timeoutMs}ms`)),
                    server.timeoutMs,
                  ),
                ),
              ]);
              return { serverId: server.id, tools };
            } catch (error) {
              logger.error(
                `Failed to load MCP tools for server ${server.name}:`,
                error,
              );
              closeServerCache(server.id);
              return { serverId: server.id, tools: {} };
            }
          });

          const results = await Promise.all(promises);
          for (const result of results) {
            Object.assign(allTools, result.tools);
          }
        }

        if (currentVersionRef.current !== version) return;

        // Update ref synchronously with state to prevent race conditions
        mcpToolsRef.current = allTools;
        mcpLoadedRef.current = true;
        setMcpTools(allTools);
        setMcpLoaded(true);
      } catch (error) {
        logger.error("Failed to load MCP tools in background:", error);
        // Update ref synchronously with state to prevent race conditions
        mcpToolsRef.current = {};
        mcpLoadedRef.current = true;
        setMcpTools({});
        setMcpLoaded(true);
      } finally {
        setIsMcpLoading(false);
      }
    };

    const promise = loadMcpTools();
    loadingPromiseRef.current = promise;
  }, [mcpServers, parallelLoadLimit]);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    const filteredStaticTools: ToolSet = {};
    for (const [toolId, tool] of Object.entries(staticTools)) {
      if (enabledTools[toolId as ToolId]) {
        filteredStaticTools[toolId] = tool;
      }
    }

    if (mcpLoadedRef.current) {
      return {
        ...filteredStaticTools,
        ...mcpToolsRef.current,
      };
    }

    if (loadingPromiseRef.current) {
      await loadingPromiseRef.current;
    }

    return {
      ...filteredStaticTools,
      ...mcpToolsRef.current,
    };
  }, [enabledTools]);

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded }}>
      {children}
    </ToolsContext.Provider>
  );
};
