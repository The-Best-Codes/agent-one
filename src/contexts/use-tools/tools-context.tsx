import type { Tool, ToolSet } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import type { ToolBehavior } from "@/hooks/ai/use-model-catalog";
import {
  createCreateFileTool,
  createDateTimeTool,
  createDeleteFileTool,
  createDescribeNextToolTool,
  createEditFileTool,
  createExecuteCommandTool,
  createGetUrlContentTool,
  createMemoryTool,
  createSubAgentTool,
  createViewFileTool,
  createWaitTool,
  createWebSearchTool,
  createWikipediaTool,
  createListSettingsTool,
  createGetSettingTool,
  createUpdateSettingTool,
} from "@/lib/ai/tools";
import {
  abortMcpServerLoad,
  buildMcpServerSlugMap,
  closeServerCache,
  getToolDisplayName,
  getMcpToolsForServer,
  invalidateServerCache,
  isServerCached,
  prefixMcpToolNames,
} from "@/lib/ai/tools/mcp";
import { clearMcpOAuthCredentials, dismissMcpLoginToasts } from "@/lib/ai/tools/mcp/oauth";
import type { SubAgentExecutionContext } from "@/lib/ai/tools/subAgent";
import { mcpAuthStatesAtom, mcpServerLoadStatesAtom } from "@/lib/jotai/mcp-atoms";
import type { McpServerToolInfo } from "@/lib/jotai/mcp-atoms";
import {
  enabledToolsAtom,
  mcpParallelLoadLimitAtom,
  mcpServersAtom,
  toolConfigsAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

import { ToolsContext } from "./tools-contexts";

const logger = getLogger(import.meta.url);

export interface ToolsContextType {
  getTools: (options?: {
    subAgentContext?: SubAgentExecutionContext;
    toolBehavior?: ToolBehavior;
  }) => Promise<ToolSet>;
  isMcpLoading: boolean;
  mcpLoaded: boolean;
  restartMcpServer: (serverId: string) => void;
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

const ALWAYS_APPROVAL_FREE_TOOLS = new Set(["describeNextTool"]);

function applyApprovalConfigToTools(
  tools: ToolSet,
  defaultNeedsApproval: boolean,
  toolApprovalOverrides: Record<string, boolean> = {},
): ToolSet {
  const wrappedTools: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    wrappedTools[name] = {
      ...tool,
      needsApproval: ALWAYS_APPROVAL_FREE_TOOLS.has(name)
        ? false
        : (toolApprovalOverrides[name] ?? defaultNeedsApproval),
    } as Tool<unknown, unknown>;
  }
  return wrappedTools;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
  const [enabledTools] = useAtom(enabledToolsAtom);
  const [mcpServers] = useAtom(mcpServersAtom);
  const [parallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);
  const [toolConfigs] = useAtom(toolConfigsAtom);
  const [mcpAuthStates, setMcpAuthStates] = useAtom(mcpAuthStatesAtom);
  const [, setMcpServerLoadStates] = useAtom(mcpServerLoadStatesAtom);

  const [mcpTools, setMcpTools] = useState<ToolSet>({});
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);
  const [serverRestartVersions, setServerRestartVersions] = useState<Record<string, number>>({});

  const mcpToolsRef = useRef<ToolSet>({});
  const mcpLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const enabledServerIdsRef = useRef<Set<string>>(new Set());
  const serverConfigsRef = useRef<Map<string, McpServerConfig>>(new Map());
  const serverLoadSignaturesRef = useRef<Map<string, string>>(new Map());
  const serverRestartVersionsRef = useRef<Record<string, number>>({});
  const authStatesRef = useRef<Record<string, (typeof mcpAuthStates)[string]>>({});
  const authResetPromisesRef = useRef<Map<string, Promise<unknown>>>(new Map());
  const loadIdRef = useRef(0);

  const clearMcpServerRuntimeState = useCallback(
    (serverId: string) => {
      dismissMcpLoginToasts(serverId);
      closeServerCache(serverId);
      setMcpAuthStates((prev) => {
        if (!(serverId in prev)) return prev;
        const next = { ...prev };
        delete next[serverId];
        return next;
      });
    },
    [setMcpAuthStates],
  );

  useEffect(() => {
    mcpToolsRef.current = mcpTools;
    mcpLoadedRef.current = mcpLoaded;
  }, [mcpTools, mcpLoaded]);

  useEffect(() => {
    const enabledServers = Array.isArray(mcpServers)
      ? mcpServers.filter((server) => server.enabled)
      : [];
    const previousEnabledIds = enabledServerIdsRef.current;
    const previousServerConfigs = serverConfigsRef.current;
    const previousServerLoadSignatures = serverLoadSignaturesRef.current;
    const previousServerRestartVersions = serverRestartVersionsRef.current;
    const previousAuthStates = authStatesRef.current;
    const currentServerLoadSignatures = new Map(
      mcpServers.map((server) => [server.id, getServerLoadSignature(server)]),
    );

    for (const server of mcpServers) {
      const previousServer = previousServerConfigs.get(server.id);
      const connectionChanged =
        previousServerLoadSignatures.has(server.id) &&
        previousServerLoadSignatures.get(server.id) !== currentServerLoadSignatures.get(server.id);

      if (connectionChanged) {
        clearMcpServerRuntimeState(server.id);

        if (
          previousServer?.type === "http" &&
          server.type === "http" &&
          previousServer.url !== server.url
        ) {
          const resetPromise = clearMcpOAuthCredentials(server.id).catch((error) => {
            logger.error(`Failed to reset OAuth credentials for ${server.name}:`, error);
          });
          authResetPromisesRef.current.set(server.id, resetPromise);
          void resetPromise.finally(() => {
            if (authResetPromisesRef.current.get(server.id) === resetPromise) {
              authResetPromisesRef.current.delete(server.id);
            }
          });
        }
      }
    }

    setMcpServerLoadStates((prev) => {
      const next: Record<string, (typeof prev)[string]> = {};

      for (const server of mcpServers) {
        const previous = prev[server.id];
        next[server.id] = {
          status: server.enabled ? (previous?.status ?? "unknown") : "disabled",
          toolCount: previous?.toolCount ?? 0,
          toolNames: previous?.toolNames ?? [],
          tools: previous?.tools ?? [],
          error: server.enabled ? previous?.error : undefined,
        };
      }

      return next;
    });

    const newEnabledIds = new Set(enabledServers.map((server) => server.id));
    for (const serverId of previousEnabledIds) {
      if (!newEnabledIds.has(serverId)) {
        logger.verbose(`Cleaning up disabled server: ${serverId}`);
        clearMcpServerRuntimeState(serverId);
      }
    }
    enabledServerIdsRef.current = newEnabledIds;
    serverConfigsRef.current = new Map(mcpServers.map((server) => [server.id, server]));
    serverLoadSignaturesRef.current = currentServerLoadSignatures;
    serverRestartVersionsRef.current = serverRestartVersions;
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
            tools: [],
          };
        }

        return next;
      });
      return;
    }

    const cachedServers = enabledServers.filter((server) => isServerCached(server));
    const forceReloadUncachedServers = !mcpLoadedRef.current;
    const serversToLoad = enabledServers.filter((server) => {
      if (isServerCached(server)) {
        return false;
      }

      if (forceReloadUncachedServers) {
        return true;
      }

      if (!previousEnabledIds.has(server.id)) {
        return true;
      }

      if (
        previousServerLoadSignatures.get(server.id) !== currentServerLoadSignatures.get(server.id)
      ) {
        return true;
      }

      if (previousServerRestartVersions[server.id] !== serverRestartVersions[server.id]) {
        return true;
      }

      if (
        previousAuthStates[server.id] !== mcpAuthStates[server.id] &&
        mcpAuthStates[server.id] === undefined
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
          Object.assign(allTools, prefixMcpToolNames(wrappedTools, serverSlug, server.id));
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
            tools: previous?.tools ?? [],
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

          await Promise.all(
            chunk.map(async (server) => {
              try {
                await authResetPromisesRef.current.get(server.id);
                const tools = await Promise.race([
                  getMcpToolsForServer(server),
                  new Promise<ToolSet>((_, reject) =>
                    setTimeout(
                      () => reject(new Error(`Timeout after ${server.timeoutMs}ms`)),
                      server.timeoutMs,
                    ),
                  ),
                ]);
                const toolEntries = Object.entries(tools).map(([name, tool]) => ({
                  name,
                  title: typeof tool.metadata?.title === "string" ? tool.metadata.title : undefined,
                }));
                const toolDisplayNames = toolEntries.map(({ name, title }) =>
                  getToolDisplayName(name, title),
                );
                const toolInfo: McpServerToolInfo[] = toolEntries;
                const wrappedTools = applyApprovalConfigToTools(
                  tools,
                  server.requiresApproval ?? false,
                  server.toolApprovalOverrides,
                );
                const result = {
                  server,
                  serverSlug: slugMap.get(server.id) ?? server.id,
                  status: "loaded" as const,
                  toolNames: toolDisplayNames,
                  toolInfo,
                  tools: wrappedTools,
                };
                if (loadId !== loadIdRef.current) return;
                Object.assign(
                  allTools,
                  prefixMcpToolNames(result.tools, result.serverSlug, server.id),
                );
                setMcpTools({ ...allTools });
                setMcpServerLoadStates((prev) => ({
                  ...prev,
                  [server.id]: {
                    status: "loaded",
                    toolCount: result.toolNames.length,
                    toolNames: result.toolNames,
                    tools: result.toolInfo,
                  },
                }));
              } catch (error) {
                const serverTypeLabel = server.type === "stdio" ? "STDIO" : "HTTP";
                logger.error(
                  `Failed to load MCP tools for ${serverTypeLabel} server ${server.name}:`,
                  error,
                );
                if (loadId !== loadIdRef.current) return;
                abortMcpServerLoad(server.id);
                closeServerCache(server.id);
                setMcpServerLoadStates((prev) => {
                  const previous = prev[server.id];
                  return {
                    ...prev,
                    [server.id]: {
                      status: "error",
                      toolCount: previous?.toolCount ?? 0,
                      toolNames: previous?.toolNames ?? [],
                      tools: previous?.tools ?? [],
                      error: error instanceof Error ? error.message : "Unknown error",
                    },
                  };
                });
              }
            }),
          );
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
              tools: previous?.tools ?? [],
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
  }, [
    mcpServers,
    parallelLoadLimit,
    mcpAuthStates,
    serverRestartVersions,
    clearMcpServerRuntimeState,
    setMcpServerLoadStates,
  ]);

  const restartMcpServer = useCallback(
    (serverId: string) => {
      clearMcpServerRuntimeState(serverId);
      setServerRestartVersions((prev) => ({
        ...prev,
        [serverId]: (prev[serverId] ?? 0) + 1,
      }));
    },
    [clearMcpServerRuntimeState],
  );

  const getTools = useCallback(
    async (options?: {
      subAgentContext?: SubAgentExecutionContext;
      toolBehavior?: ToolBehavior;
    }): Promise<ToolSet> => {
      const filteredStaticTools: ToolSet = {};
      const mergedEnabledTools = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools };
      const mergedToolConfigs = {
        dateTime: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.dateTime, ...toolConfigs.dateTime },
        waitNumberMilliseconds: {
          ...DEFAULT_SETTINGS.TOOL_CONFIGS.waitNumberMilliseconds,
          ...toolConfigs.waitNumberMilliseconds,
        },
        getUrlContent: {
          ...DEFAULT_SETTINGS.TOOL_CONFIGS.getUrlContent,
          ...toolConfigs.getUrlContent,
        },
        webSearch: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.webSearch, ...toolConfigs.webSearch },
        wikipedia: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.wikipedia, ...toolConfigs.wikipedia },
        memory: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.memory, ...toolConfigs.memory },
        editFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.editFile, ...toolConfigs.editFile },
        createFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.createFile, ...toolConfigs.createFile },
        deleteFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.deleteFile, ...toolConfigs.deleteFile },
        viewFile: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.viewFile, ...toolConfigs.viewFile },
        executeCommand: {
          ...DEFAULT_SETTINGS.TOOL_CONFIGS.executeCommand,
          ...toolConfigs.executeCommand,
        },
        subAgent: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.subAgent, ...toolConfigs.subAgent },
        listSettings: {
          ...DEFAULT_SETTINGS.TOOL_CONFIGS.listSettings,
          ...toolConfigs.listSettings,
        },
        getSetting: { ...DEFAULT_SETTINGS.TOOL_CONFIGS.getSetting, ...toolConfigs.getSetting },
        updateSetting: {
          ...DEFAULT_SETTINGS.TOOL_CONFIGS.updateSetting,
          ...toolConfigs.updateSetting,
        },
      };

      if (mergedEnabledTools.dateTime) {
        filteredStaticTools.dateTime = createDateTimeTool(mergedToolConfigs.dateTime);
      }
      if (mergedEnabledTools.waitNumberMilliseconds) {
        filteredStaticTools.waitNumberMilliseconds = createWaitTool(
          mergedToolConfigs.waitNumberMilliseconds,
        );
      }
      if (mergedEnabledTools.getUrlContent) {
        filteredStaticTools.getUrlContent = createGetUrlContentTool(
          mergedToolConfigs.getUrlContent,
        );
      }
      if (mergedEnabledTools.webSearch) {
        filteredStaticTools.webSearch = createWebSearchTool(mergedToolConfigs.webSearch);
      }
      if (mergedEnabledTools.wikipedia) {
        filteredStaticTools.wikipedia = createWikipediaTool(mergedToolConfigs.wikipedia);
      }
      if (mergedEnabledTools.memory) {
        filteredStaticTools.memory = createMemoryTool(mergedToolConfigs.memory);
      }
      if (mergedEnabledTools.editFile) {
        filteredStaticTools.editFile = createEditFileTool(mergedToolConfigs.editFile);
      }
      if (mergedEnabledTools.createFile) {
        filteredStaticTools.createFile = createCreateFileTool(mergedToolConfigs.createFile);
      }
      if (mergedEnabledTools.deleteFile) {
        filteredStaticTools.deleteFile = createDeleteFileTool(mergedToolConfigs.deleteFile);
      }
      if (mergedEnabledTools.viewFile) {
        filteredStaticTools.viewFile = createViewFileTool(mergedToolConfigs.viewFile);
      }
      if (mergedEnabledTools.executeCommand) {
        filteredStaticTools.executeCommand = createExecuteCommandTool(
          mergedToolConfigs.executeCommand,
        );
      }
      if (mergedEnabledTools.subAgent && options?.subAgentContext) {
        filteredStaticTools.subAgent = createSubAgentTool(
          mergedToolConfigs.subAgent,
          options.subAgentContext,
        );
      }
      if (mergedEnabledTools.listSettings) {
        filteredStaticTools.listSettings = createListSettingsTool(mergedToolConfigs.listSettings);
      }
      if (mergedEnabledTools.getSetting) {
        filteredStaticTools.getSetting = createGetSettingTool(mergedToolConfigs.getSetting);
      }
      if (mergedEnabledTools.updateSetting) {
        filteredStaticTools.updateSetting = createUpdateSettingTool(
          mergedToolConfigs.updateSetting,
        );
      }

      if (!mcpLoadedRef.current && loadingPromiseRef.current) {
        await loadingPromiseRef.current;
      }

      let tools: ToolSet = {
        ...filteredStaticTools,
        ...mcpToolsRef.current,
        ...(Object.keys(mcpToolsRef.current).length > 0 && {
          describeNextTool: createDescribeNextToolTool(),
        }),
      };

      if (options?.toolBehavior === "ask" || options?.toolBehavior === "yolo") {
        tools = applyApprovalConfigToTools(tools, options.toolBehavior === "ask");
      }

      return tools;
    },
    [enabledTools, toolConfigs],
  );

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded, restartMcpServer }}>
      {children}
    </ToolsContext.Provider>
  );
};
