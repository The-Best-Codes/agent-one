import type { ToolSet } from "ai";
import React, { type ReactNode, useCallback, useEffect, useState } from "react";

import { staticTools } from "@/lib/ai/tools";
import { getMcpTools } from "@/lib/ai/tools/mcp";
import { getLogger } from "@/lib/logger";

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
  const [mcpTools, setMcpTools] = useState<ToolSet | null>(null);
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const [mcpLoaded, setMcpLoaded] = useState(false);

  useEffect(() => {
    const loadMcpTools = async () => {
      setIsMcpLoading(true);
      try {
        logger.verbose("Starting background MCP tools loading...");
        const tools = await getMcpTools();
        setMcpTools(tools);
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

    loadMcpTools();
  }, []);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    if (mcpLoaded) {
      return {
        ...staticTools,
        ...(mcpTools || {}),
      };
    } else {
      logger.verbose("MCP tools not loaded yet, waiting...");
      // Since loading is async, we need to poll or use a promise
      // For simplicity, since it's background, but to wait, we can do:
      while (!mcpLoaded) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Poll every 100ms
      }
      return {
        ...staticTools,
        ...(mcpTools || {}),
      };
    }
  }, [mcpLoaded, mcpTools]);

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded }}>
      {children}
    </ToolsContext.Provider>
  );
};
