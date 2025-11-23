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
import { connectToMcpServer, type McpConnection } from "@/lib/ai/tools/mcp";
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

interface ActiveServer {
  config: McpServerConfig;
  tools: ToolSet;
  close: () => Promise<void>;
}

const isSameConfig = (a: McpServerConfig, b: McpServerConfig) => {
  return (
    a.command === b.command &&
    a.timeoutMs === b.timeoutMs &&
    a.enabled === b.enabled
  );
};

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
  const [enabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);

  const [mcpTools, setMcpTools] = useState<ToolSet>({});
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);
  const [initialLoadPromise, setInitialLoadPromise] =
    useState<Promise<void> | null>(null);

  // Store active connections: ServerID -> ActiveServer
  const activeServersRef = useRef<Map<string, ActiveServer>>(new Map());
  // Track in-progress operations to prevent duplicate processing: ServerID -> Config
  const processingRef = useRef<Map<string, McpServerConfig>>(new Map());
  // Keep track of latest servers to handle race conditions
  const latestMcpServersRef = useRef(mcpServers);

  // Refs for sync access in getTools
  const mcpToolsRef = useRef<ToolSet>({});
  const mcpLoadedRef = useRef(false);
  const initialLoadPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
    initialLoadPromiseRef.current = initialLoadPromise;
  }, [mcpTools, mcpLoaded, initialLoadPromise]);

  useEffect(() => {
    latestMcpServersRef.current = mcpServers;
  }, [mcpServers]);

  // Main effect to reconcile servers
  useEffect(() => {
    const reconcileServers = async () => {
      const enabledServers = mcpServers.filter((s) => s.enabled);

      // Determine what needs to change
      const toAdd: McpServerConfig[] = [];
      const toRemove: string[] = [];

      // 1. Find servers to remove or update (config changed)
      for (const [id, active] of activeServersRef.current.entries()) {
        const currentConfig = enabledServers.find((s) => s.id === id);

        if (!currentConfig) {
          // Server was removed or disabled
          toRemove.push(id);
        } else if (!isSameConfig(active.config, currentConfig)) {
          // Config changed, need to restart
          toRemove.push(id);
          // It will be picked up by the "toAdd" logic below because it won't be in activeServersRef after removal?
          // Actually, we process removals first, but we calculate lists first.
          // If it's in toRemove, it's effectively gone. We need to ensure it gets added back with new config.
        }
      }

      // 2. Find servers to add
      for (const server of enabledServers) {
        const active = activeServersRef.current.get(server.id);
        const isMarkedForRemoval = toRemove.includes(server.id);

        // If it's not active, OR it's marked for removal (update), we might need to add it.
        if (!active || isMarkedForRemoval) {
          // Check if we are already loading this exact config
          const pendingConfig = processingRef.current.get(server.id);
          if (pendingConfig && isSameConfig(pendingConfig, server)) {
            // Already loading this config, skip to prevent duplicates
            continue;
          }
          toAdd.push(server);
        }
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        if (!mcpLoaded) setMcpLoaded(true);
        return;
      }

      setIsMcpLoading(true);

      // Process removals first
      for (const id of toRemove) {
        const active = activeServersRef.current.get(id);
        if (active) {
          logger.verbose(`Stopping MCP server: ${active.config.name}`);
          try {
            await active.close();
          } catch (err) {
            logger.error(
              `Error closing MCP server ${active.config.name}:`,
              err,
            );
          }
          activeServersRef.current.delete(id);
        }
      }

      // Process additions
      if (toAdd.length > 0) {
        logger.verbose(`Starting ${toAdd.length} MCP servers...`);

        // Mark as processing
        toAdd.forEach((s) => processingRef.current.set(s.id, s));

        // Chunking logic
        const chunks = [];
        for (let i = 0; i < toAdd.length; i += parallelLoadLimit) {
          chunks.push(toAdd.slice(i, i + parallelLoadLimit));
        }

        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (server) => {
              try {
                const connection = (await Promise.race([
                  connectToMcpServer(server),
                  new Promise<never>((_, reject) =>
                    setTimeout(
                      () => reject(new Error("Timeout")),
                      server.timeoutMs,
                    ),
                  ),
                ])) as McpConnection;

                // Check if the server is still valid according to the latest state
                // This handles race conditions where the user might have disabled/changed the server while it was loading
                const latestConfig = latestMcpServersRef.current.find(
                  (s) => s.id === server.id && s.enabled,
                );

                if (!latestConfig || !isSameConfig(latestConfig, server)) {
                  logger.verbose(
                    `Server ${server.name} config changed or disabled during load, closing...`,
                  );
                  await connection.close();
                  return;
                }

                activeServersRef.current.set(server.id, {
                  config: server,
                  tools: connection.tools,
                  close: connection.close,
                });
              } catch (error) {
                logger.error(
                  `Failed to connect to MCP server ${server.name}:`,
                  error,
                );
              } finally {
                processingRef.current.delete(server.id);
              }
            }),
          );
        }
      }

      // Rebuild aggregated tools
      const allTools: ToolSet = {};
      for (const active of activeServersRef.current.values()) {
        Object.assign(allTools, active.tools);
      }

      setMcpTools(allTools);
      setMcpLoaded(true);
      setIsMcpLoading(false);
    };

    const promise = reconcileServers();
    if (!mcpLoaded) {
      setInitialLoadPromise(promise);
    }
  }, [mcpServers, parallelLoadLimit, mcpLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    const activeServersValue = activeServersRef.current;

    return () => {
      activeServersValue.forEach(async (active) => {
        try {
          await active.close();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // no-op
        }
      });
      activeServersValue.clear();
    };
  }, []);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    // Filter static tools based on enabled settings
    const filteredStaticTools: ToolSet = {};
    for (const [toolId, tool] of Object.entries(staticTools)) {
      if (enabledTools[toolId as ToolId]) {
        filteredStaticTools[toolId] = tool;
      }
    }

    // If initial load is not complete, wait for it
    if (!mcpLoadedRef.current && initialLoadPromiseRef.current) {
      logger.verbose("Waiting for initial MCP load...");
      await initialLoadPromiseRef.current;
    }

    return {
      ...filteredStaticTools,
      ...(mcpToolsRef.current || {}),
    };
  }, [enabledTools]);

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded }}>
      {children}
    </ToolsContext.Provider>
  );
};
