import type { Tool, ToolSet } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import {
  createCreateFileTool,
  createDateTimeTool,
  createDeleteFileTool,
  createEditFileTool,
  createGetUrlContentTool,
  createViewFileTool,
  createWaitTool,
  createWebSearchTool,
} from "@/lib/ai/tools";
import {
  buildMcpServerSlugMap,
  closeServerCache,
  getMcpToolsForServer,
  invalidateServerCache,
  isServerCached,
  prefixMcpToolNames,
} from "@/lib/ai/tools/mcp";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
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

function getServerLoadSignature(server: McpServerConfig): string {
  if (server.type === "stdio") {
    return JSON.stringify({
      type: "stdio",
      command: server.command,
      env: server.env,
    });
  }

  return JSON.stringify({
    type: "http",
    url: server.url,
    headers: server.headers,
  });
}

function applyApprovalConfigToTools(
  tools: ToolSet,
  defaultNeedsApproval: boolean,
  toolApprovalOverrides: Record<string, boolean> = {},
): ToolSet {
  const wrappedTools: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    wrappedTools[name] = {
      ...tool,
      needsApproval: toolApprovalOverrides[name] ?? defaultNeedsApproval,
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
  const [, setMcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);

  const [mcpTools, setMcpTools] = useState<ToolSet>({});
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);

  const mcpToolsRef = useRef<ToolSet>({});
  const mcpLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const enabledServerIdsRef = useRef<Set<string>>(new Set());
  const serverLoadSignaturesRef = useRef<Map<string, string>>(new Map());
  const authStatesRef = useRef<Record<string, (typeof mcpAuthStates)[string]>>({});
  const loadIdRef = useRef(0);

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
  }, [mcpTools, mcpLoaded]);

  useEffect(() => {
    const enabledServers = Array.isArray(mcpServers)
      ? mcpServers.filter((server) => server.enabled)
      : [];
    const previousEnabledIds = enabledServerIdsRef.current;
    const previousServerLoadSignatures = serverLoadSignaturesRef.current;
    const previousAuthStates = authStatesRef.current;
    const currentServerLoadSignatures = new Map(
      mcpServers.map((server) => [server.id, getServerLoadSignature(server)]),
    );

    setMcpServerLoadStates((prev) => {
      const next: Record<string, (typeof prev)[string]> = {};

      for (const server of mcpServers) {
        const previous = prev[server.id];
        next[server.id] = {
          status: server.enabled ? (previous?.status ?? "unknown") : "disabled",
          toolCount: previous?.toolCount ?? 0,
          toolNames: previous?.toolNames ?? [],
          error: server.enabled ? previous?.error : undefined,
        };
      }

      return next;
    });

    const newEnabledIds = new Set(enabledServers.map((server) => server.id));
    for (const serverId of previousEnabledIds) {
      if (!newEnabledIds.has(serverId)) {
        logger.verbose(`Cleaning up disabled server: ${serverId}`);
        closeServerCache(serverId);
      }
    }
    enabledServerIdsRef.current = newEnabledIds;
    serverLoadSignaturesRef.current = currentServerLoadSignatures;
    authStatesRef.current = mcpAuthStates;

    if (enabledServers.length === 0) {
      invalidateServerCache();
      mcpToolsRef.current = {};
      mcpLoadedRef.current = true;
      setMcpTools({});
      setMcpLoaded(true);
      setIsMcpLoading(false);
      setMcpServerLoadStates((prev) => {
        const next = { ...prev };

        for (const server of mcpServers) {
          next[server.id] = {
            status: server.enabled ? "unknown" : "disabled",
            toolCount: 0,
            toolNames: [],
          };
        }

        return next;
      });
      return;
    }

    const cachedServers = enabledServers.filter((server) => isServerCached(server));
    const serversToLoad = enabledServers.filter((server) => {
      if (isServerCached(server)) {
        return false;
      }

      if (!previousEnabledIds.has(server.id)) {
        return true;
      }

      if (
        previousServerLoadSignatures.get(server.id) !== currentServerLoadSignatures.get(server.id)
      ) {
        return true;
      }

      return (
        previousAuthStates[server.id] !== mcpAuthStates[server.id] &&
        mcpAuthStates[server.id] === "logged-in"
      );
    });

    const loadId = ++loadIdRef.current;

    const loadMcpTools = async () => {
      const slugMap = buildMcpServerSlugMap(enabledServers);

      const allTools: ToolSet = {};

      for (const server of cachedServers) {
        try {
          const tools = await getMcpToolsForServer(server);
          const wrappedTools = applyApprovalConfigToTools(
            tools,
            server.requiresApproval ?? false,
            server.toolApprovalOverrides,
          );
          const serverSlug = slugMap.get(server.id) ?? server.id;
          Object.assign(allTools, prefixMcpToolNames(wrappedTools, serverSlug));
        } catch (error) {
          logger.error(`Failed to load cached MCP tools for ${server.name}:`, error);
          closeServerCache(server.id);
        }
      }

      if (serversToLoad.length === 0) {
        if (loadId !== loadIdRef.current) return;
        mcpToolsRef.current = allTools;
        mcpLoadedRef.current = true;
        setMcpTools(allTools);
        setMcpLoaded(true);
        setIsMcpLoading(false);
        return;
      }

      mcpLoadedRef.current = false;
      setIsMcpLoading(true);
      setMcpLoaded(false);

      mcpToolsRef.current = allTools;
      setMcpTools({ ...allTools });

      setMcpServerLoadStates((prev) => {
        const next = { ...prev };

        for (const server of serversToLoad) {
          const previous = prev[server.id];
          next[server.id] = {
            status: server.type === "stdio" ? "starting" : "connecting",
            toolCount: previous?.toolCount ?? 0,
            toolNames: previous?.toolNames ?? [],
          };
        }

        return next;
      });

      try {
        const chunks: McpServerConfig[][] = [];
        for (let i = 0; i < serversToLoad.length; i += parallelLoadLimit) {
          chunks.push(serversToLoad.slice(i, i + parallelLoadLimit));
        }

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
                const toolNames = Object.keys(tools);
                const wrappedTools = applyApprovalConfigToTools(
                  tools,
                  server.requiresApproval ?? false,
                  server.toolApprovalOverrides,
                );
                return {
                  server,
                  serverSlug: slugMap.get(server.id) ?? server.id,
                  status: "loaded" as const,
                  toolNames,
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
                  server,
                  serverSlug: slugMap.get(server.id) ?? server.id,
                  error: error instanceof Error ? error.message : "Unknown error",
                  status: "error" as const,
                  toolNames: [],
                  tools: {},
                };
              }
            }),
          );

          for (const result of results) {
            Object.assign(allTools, prefixMcpToolNames(result.tools, result.serverSlug));
          }

          setMcpServerLoadStates((prev) => {
            const next = { ...prev };

            for (const result of results) {
              const previous = prev[result.server.id];
              next[result.server.id] =
                result.status === "loaded"
                  ? {
                      status: "loaded",
                      toolCount: result.toolNames.length,
                      toolNames: result.toolNames,
                    }
                  : {
                      status: "error",
                      toolCount: previous?.toolCount ?? 0,
                      toolNames: previous?.toolNames ?? [],
                      error: result.error,
                    };
            }

            return next;
          });
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
        setMcpServerLoadStates((prev) => {
          const next = { ...prev };

          for (const server of enabledServers) {
            const previous = prev[server.id];
            next[server.id] = {
              status: "error",
              toolCount: previous?.toolCount ?? 0,
              toolNames: previous?.toolNames ?? [],
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }

          return next;
        });
      } finally {
        setIsMcpLoading(false);
      }
    };

    const promise = loadMcpTools();
    loadingPromiseRef.current = promise;
  }, [mcpServers, parallelLoadLimit, mcpAuthStates, setMcpServerLoadStates]);

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
    if (enabledTools.editFile) {
      filteredStaticTools.editFile = createEditFileTool(toolConfigs.editFile);
    }
    if (enabledTools.createFile) {
      filteredStaticTools.createFile = createCreateFileTool(toolConfigs.createFile);
    }
    if (enabledTools.deleteFile) {
      filteredStaticTools.deleteFile = createDeleteFileTool(toolConfigs.deleteFile);
    }
    if (enabledTools.viewFile) {
      filteredStaticTools.viewFile = createViewFileTool(toolConfigs.viewFile);
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
