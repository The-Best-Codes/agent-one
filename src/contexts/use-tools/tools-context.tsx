import type { Tool, ToolSet } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import {
  createDateTimeTool,
  createGetUrlContentTool,
  createWaitTool,
  createWebSearchTool,
} from "@/lib/ai/tools";
import {
  buildMcpServerSlugMap,
  closeServerCache,
  getMcpToolsForServer,
  invalidateServerCache,
  prefixMcpToolNames,
} from "@/lib/ai/tools/mcp";
import { mcpAuthStatesAtom } from "@/lib/jotai/mcp-atoms";
import {
  enabledToolsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
  toolConfigsAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { type McpServerConfig } from "@/lib/settings/types";

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

function applyNeedsApprovalToTools(tools: ToolSet, needsApproval: boolean): ToolSet {
  if (!needsApproval) {
    return tools;
  }

  const wrappedTools: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    wrappedTools[name] = {
      ...tool,
      needsApproval: true,
    } as Tool<unknown, unknown>;
  }
  return wrappedTools;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
  const [enabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);
  const [toolConfigs] = useAtom(toolConfigsAtom);
  const [mcpAuthStates] = useAtom(mcpAuthStatesAtom);

  const [mcpTools, setMcpTools] = useState<ToolSet>({});
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);

  const mcpToolsRef = useRef<ToolSet>({});
  const mcpLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const enabledServerIdsRef = useRef<Set<string>>(new Set());
  const loadIdRef = useRef(0);

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
  }, [mcpTools, mcpLoaded]);

  useEffect(() => {
    const enabledServers = Array.isArray(mcpServers)
      ? mcpServers.filter((server) => server.enabled)
      : [];

    const newEnabledIds = new Set(enabledServers.map((server) => server.id));
    for (const serverId of enabledServerIdsRef.current) {
      if (!newEnabledIds.has(serverId)) {
        logger.verbose(`Cleaning up disabled server: ${serverId}`);
        closeServerCache(serverId);
      }
    }
    enabledServerIdsRef.current = newEnabledIds;

    if (enabledServers.length === 0) {
      invalidateServerCache();
      mcpToolsRef.current = {};
      mcpLoadedRef.current = true;
      setMcpTools({});
      setMcpLoaded(true);
      setIsMcpLoading(false);
      return;
    }

    const loadId = ++loadIdRef.current;

    const loadMcpTools = async () => {
      mcpLoadedRef.current = false;
      setIsMcpLoading(true);
      setMcpLoaded(false);

      try {
        const slugMap = buildMcpServerSlugMap(enabledServers);

        const chunks: McpServerConfig[][] = [];
        for (let i = 0; i < enabledServers.length; i += parallelLoadLimit) {
          chunks.push(enabledServers.slice(i, i + parallelLoadLimit));
        }

        const allTools: ToolSet = {};

        for (const chunk of chunks) {
          if (loadId !== loadIdRef.current) return;

          const results = await Promise.all(
            chunk.map(async (server) => {
              try {
                const tools = await Promise.race([
                  getMcpToolsForServer(server),
                  new Promise<ToolSet>((_, reject) =>
                    setTimeout(
                      () => reject(new Error(`Timeout after ${server.timeoutMs}ms`)),
                      server.timeoutMs,
                    ),
                  ),
                ]);
                const wrappedTools = applyNeedsApprovalToTools(
                  tools,
                  server.requiresApproval ?? false,
                );
                return {
                  serverSlug: slugMap.get(server.id) ?? server.id,
                  tools: wrappedTools,
                };
              } catch (error) {
                const serverTypeLabel = server.type === "stdio" ? "STDIO" : "HTTP";
                logger.error(
                  `Failed to load MCP tools for ${serverTypeLabel} server ${server.name}:`,
                  error,
                );
                closeServerCache(server.id);
                return {
                  serverSlug: slugMap.get(server.id) ?? server.id,
                  tools: {},
                };
              }
            }),
          );

          for (const result of results) {
            Object.assign(allTools, prefixMcpToolNames(result.tools, result.serverSlug));
          }
        }

        if (loadId !== loadIdRef.current) return;

        mcpToolsRef.current = allTools;
        mcpLoadedRef.current = true;
        setMcpTools(allTools);
        setMcpLoaded(true);
      } catch (error) {
        logger.error("Failed to load MCP tools in background:", error);
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
  }, [mcpServers, parallelLoadLimit, mcpAuthStates]);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    const filteredStaticTools: ToolSet = {};

    if (enabledTools.dateTime) {
      filteredStaticTools.dateTime = createDateTimeTool(toolConfigs.dateTime);
    }
    if (enabledTools.waitNumberMilliseconds) {
      filteredStaticTools.waitNumberMilliseconds = createWaitTool(
        toolConfigs.waitNumberMilliseconds,
      );
    }
    if (enabledTools.getUrlContent) {
      filteredStaticTools.getUrlContent = createGetUrlContentTool(toolConfigs.getUrlContent);
    }
    if (enabledTools.webSearch) {
      filteredStaticTools.webSearch = createWebSearchTool(toolConfigs.webSearch);
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
  }, [enabledTools, toolConfigs]);

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded }}>
      {children}
    </ToolsContext.Provider>
  );
};
