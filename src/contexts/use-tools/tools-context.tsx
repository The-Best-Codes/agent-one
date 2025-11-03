import type { ToolSet } from "ai";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

    const promise = loadMcpTools();
    setLoadingPromise(promise);
  }, []);

  const getTools = useCallback(async (): Promise<ToolSet> => {
    if (mcpLoadedRef.current) {
      return {
        ...staticTools,
        ...(mcpToolsRef.current || {}),
      };
    }

    if (loadingPromiseRef.current) {
      logger.verbose("MCP tools not loaded yet, waiting for promise...");
      await loadingPromiseRef.current;
    }

    return {
      ...staticTools,
      ...(mcpToolsRef.current || {}),
    };
  }, []);

  return (
    <ToolsContext.Provider value={{ getTools, isMcpLoading, mcpLoaded }}>
      {children}
    </ToolsContext.Provider>
  );
};
