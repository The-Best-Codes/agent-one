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
import { getMcpToolsForServer } from "@/lib/ai/tools/mcp";
import {
  enabledToolsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { type ToolId } from "@/lib/settings/types";

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

  const [mcpTools, setMcpTools] = useState<ToolSet | null>(null);
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);
  const [loadingPromise, setLoadingPromise] = useState<Promise<void> | null>(
    null,
  );

  const mcpToolsRef = useRef<ToolSet | null>(null);
  const mcpLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
    loadingPromiseRef.current = loadingPromise;
  }, [mcpTools, mcpLoaded, loadingPromise]);

  // Load MCP tools when servers change
  useEffect(() => {
    const enabledServers = Array.isArray(mcpServers)
      ? mcpServers.filter((server) => server.enabled)
      : [];
    if (enabledServers.length === 0) {
      setMcpTools({});
      setMcpLoaded(true);
      setIsMcpLoading(false);
      setLoadingPromise(null);
      return;
    }

    const loadMcpTools = async () => {
      setIsMcpLoading(true);
      setMcpLoaded(false);

      try {
        logger.verbose(
          `Starting background MCP tools loading for ${enabledServers.length} servers...`,
        );

        // Load servers in parallel with limit
        const chunks = [];
        for (let i = 0; i < enabledServers.length; i += parallelLoadLimit) {
          chunks.push(enabledServers.slice(i, i + parallelLoadLimit));
        }

        const allTools: ToolSet = {};

        for (const chunk of chunks) {
          const promises = chunk.map(async (server) => {
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
              return { serverId: server.id, tools: {} };
            }
          });

          const results = await Promise.all(promises);
          for (const result of results) {
            Object.assign(allTools, result.tools);
          }
        }

        setMcpTools(allTools);
        setMcpLoaded(true);
        logger.verbose("MCP tools loaded in background.");
      } catch (error) {
        logger.error("Failed to load MCP tools in background:", error);
        setMcpTools({});
        setMcpLoaded(true);
      } finally {
        setIsMcpLoading(false);
      }
    };

    const promise = loadMcpTools();
    setLoadingPromise(promise);
  }, [mcpServers, parallelLoadLimit]);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    // Filter static tools based on enabled settings
    const filteredStaticTools: ToolSet = {};
    for (const [toolId, tool] of Object.entries(staticTools)) {
      if (enabledTools[toolId as ToolId]) {
        filteredStaticTools[toolId] = tool;
      }
    }

    if (mcpLoadedRef.current) {
      return {
        ...filteredStaticTools,
        ...(mcpToolsRef.current || {}),
      };
    }

    if (loadingPromiseRef.current) {
      logger.verbose("MCP tools not loaded yet, waiting for promise...");
      await loadingPromiseRef.current;
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
