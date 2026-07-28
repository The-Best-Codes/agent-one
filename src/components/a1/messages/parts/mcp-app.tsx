import {
  experimental_MCPAppRenderer as MCPAppRenderer,
  type MCPAppBridgeHandlers,
  type MCPAppMetadata,
  type MCPAppSandboxConfig,
} from "@ai-sdk/react";
import { IconX } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { DynamicToolUIPart } from "ai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { useChatFunctions, useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { useTheme } from "@/hooks/use-theme";
import {
  callMcpAppTool,
  getMcpAppVisibleToolNames,
  loadMcpAppResource,
  MCP_SERVER_ID_METADATA_KEY,
  readMcpAppServerResource,
} from "@/lib/ai/tools/mcp";
import { TOOL_CANCELLED_BY_USER_SYMBOL } from "@/lib/constants";
import { getLogger } from "@/lib/logger";

// TODO: Find a more secure workaround (test this with Excalidraw MCP) and provide a setting to adjust
const DANGEROUSLY_IGNORE_CSP = true;

const logger = getLogger(import.meta.url);

const hostInfo = { name: "AgentOne", version: packageJson.version };
const DISPLAY_MODES = ["inline", "fullscreen", "pip"] as const;
const DEFAULT_INLINE_HEIGHT = 320;
const FULLSCREEN_HEADER_HEIGHT = 64;

function getMessageText(params: unknown): string {
  if (!params || typeof params !== "object" || (params as { role?: unknown }).role !== "user") {
    throw new Error("MCP App messages must have the user role.");
  }

  const content = (params as { content?: unknown }).content;
  const blocks = Array.isArray(content) ? content : [content];
  const text = blocks
    .filter(
      (block): block is { type: "text"; text: string } =>
        !!block &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "text" &&
        typeof (block as { text?: unknown }).text === "string",
    )
    .map((block) => block.text)
    .join("\n");

  if (!text) {
    throw new Error("MCP App messages must contain text content.");
  }
  return text;
}

function validateModelContext(params: unknown): unknown {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new Error("MCP App model context must be an object.");
  }
  JSON.stringify(params);
  return params;
}

function getServerId(part: DynamicToolUIPart): string | undefined {
  const serverId = part.toolMetadata?.[MCP_SERVER_ID_METADATA_KEY];
  return typeof serverId === "string" ? serverId : undefined;
}

export function MessagePartMcpApp({
  part,
  fallback,
}: {
  part: DynamicToolUIPart;
  fallback: ReactNode;
}) {
  const serverId = getServerId(part);

  if (
    !serverId ||
    (part.state !== "input-available" &&
      part.state !== "output-available" &&
      part.state !== "output-error")
  ) {
    return fallback;
  }

  return <ConnectedMcpApp part={part} serverId={serverId} fallback={fallback} />;
}

function ConnectedMcpApp({
  part,
  serverId,
  fallback,
}: {
  part: DynamicToolUIPart;
  serverId: string;
  fallback: ReactNode;
}) {
  const { mcpLoaded } = useTools();
  const { resolvedTheme } = useTheme();
  const { sendMessage, updateMcpAppModelContext } = useChatFunctions();
  const { status } = useChatStatus();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [cancellationSent, setCancellationSent] = useState(false);
  const [displayMode, setDisplayMode] = useState<(typeof DISPLAY_MODES)[number]>("inline");
  const [inlineHeight, setInlineHeight] = useState(DEFAULT_INLINE_HEIGHT);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const isCancelled = part.state === "output-error";

  const fullscreenFrame = useMemo(() => {
    const padding = viewportSize.width < 640 ? 12 : 24;
    const width = Math.max(Math.min(1400, viewportSize.width - padding * 2), 1);
    const height = Math.max(viewportSize.height - padding * 2, 1);
    const top = Math.max(Math.round((viewportSize.height - height) / 2), padding);
    const left = Math.max(Math.round((viewportSize.width - width) / 2), padding);
    const bodyHeight = Math.max(height - FULLSCREEN_HEADER_HEIGHT, 1);

    return { top, left, width, height, bodyHeight };
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () =>
      setContainerWidth(Math.round(container.getBoundingClientRect().width));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateViewportSize = () =>
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    if (displayMode === "inline") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDisplayMode("inline");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayMode]);

  const notifyToolCancelled = useCallback(() => {
    if (!initialized || cancellationSent) return;
    const iframe = containerRef.current?.querySelector("iframe");
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        jsonrpc: "2.0",
        method: "ui/notifications/tool-cancelled",
        params: {
          reason:
            part.errorText === TOOL_CANCELLED_BY_USER_SYMBOL
              ? "Tool execution was cancelled by the user."
              : part.errorText || "Tool execution was cancelled.",
        },
      },
      window.location.origin,
    );
    setCancellationSent(true);
  }, [cancellationSent, initialized, part.errorText]);

  useEffect(() => {
    if (isCancelled) {
      notifyToolCancelled();
    }
  }, [isCancelled, notifyToolCancelled]);

  const loadResource = useCallback(
    async (app: MCPAppMetadata) => {
      if (DANGEROUSLY_IGNORE_CSP) {
        const resource = await loadMcpAppResource(serverId, app.resourceUri);
        if (resource.meta) {
          return { ...resource, meta: { ...resource.meta, csp: undefined } };
        }
        return resource;
      }
      return loadMcpAppResource(serverId, app.resourceUri);
    },
    [serverId],
  );

  const handlers = useMemo<MCPAppBridgeHandlers | undefined>(() => {
    if (!mcpLoaded) {
      return undefined;
    }

    try {
      return {
        allowedTools: getMcpAppVisibleToolNames(serverId),
        callTool: ({ name, arguments: toolArguments }) =>
          callMcpAppTool(serverId, name, toolArguments),
        readResource: ({ uri }) => readMcpAppServerResource(serverId, uri),
        openLink: async ({ url }) => {
          await openUrl(url);
          return {};
        },
        sendMessage: async (params) => {
          if (status !== "ready") {
            throw new Error("The chat is busy. Try sending the message again when it is ready.");
          }
          await sendMessage({ text: getMessageText(params) });
          return {};
        },
        updateModelContext: (params) => {
          updateMcpAppModelContext(part.toolCallId, validateModelContext(params));
          return {};
        },
        requestDisplayMode: ({ mode }) => {
          setDisplayMode(mode);
          return { mode };
        },
        onSizeChange: ({ height }) => {
          if (displayMode === "inline" && height && Number.isFinite(height) && height > 0) {
            setInlineHeight(Math.min(Math.round(height), Math.max(viewportSize.height - 32, 1)));
          }
        },
        onInitialized: () => {
          setInitialized(true);
        },
        onError: (error) => {
          logger.error("MCP App bridge error:", error);
        },
      };
    } catch (error) {
      logger.warn("Could not connect MCP App to its server:", error);
      return undefined;
    }
  }, [
    displayMode,
    mcpLoaded,
    part.toolCallId,
    sendMessage,
    serverId,
    status,
    updateMcpAppModelContext,
    viewportSize.height,
  ]);

  const sandbox = useMemo<MCPAppSandboxConfig>(() => {
    if (displayMode === "fullscreen") {
      return {
        url: "/mcp-app-sandbox.html",
        className: "fixed z-52 block rounded-b-xl bg-background",
        style: {
          border: 0,
          top: fullscreenFrame.top + FULLSCREEN_HEADER_HEIGHT,
          left: fullscreenFrame.left,
          width: fullscreenFrame.width,
          height: fullscreenFrame.bodyHeight,
        },
      };
    }
    if (displayMode === "pip") {
      return {
        url: "/mcp-app-sandbox.html",
        className: "fixed right-4 bottom-4 z-50 block rounded-md border bg-background shadow-lg",
        style: {
          border: 0,
          width: "min(400px, calc(100vw - 32px))",
          height: "min(300px, calc(100vh - 32px))",
        },
      };
    }
    return {
      url: "/mcp-app-sandbox.html",
      className: "block w-full rounded-md border",
      style: { border: 0, height: inlineHeight },
    };
  }, [
    displayMode,
    fullscreenFrame.bodyHeight,
    fullscreenFrame.left,
    fullscreenFrame.top,
    fullscreenFrame.width,
    inlineHeight,
  ]);

  const containerDimensions =
    displayMode === "fullscreen"
      ? { width: fullscreenFrame.width, height: fullscreenFrame.bodyHeight }
      : displayMode === "pip"
        ? {
            width: Math.min(400, viewportSize.width - 32),
            height: Math.min(300, viewportSize.height - 32),
          }
        : { width: containerWidth, maxHeight: Math.max(viewportSize.height - 32, 1) };

  if (!handlers) {
    return fallback;
  }

  return (
    <div ref={containerRef} className="w-full">
      {displayMode === "fullscreen" && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
            onClick={() => setDisplayMode("inline")}
          />
          <div
            className="bg-background ring-foreground/10 fixed z-51 overflow-hidden rounded-xl border text-sm shadow-xl ring-1"
            style={{
              top: fullscreenFrame.top,
              left: fullscreenFrame.left,
              width: fullscreenFrame.width,
              height: fullscreenFrame.height,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bg-background/95 flex h-16 items-center justify-between gap-3 border-b px-4">
              <div className="min-w-0">
                <div className="truncate text-base font-medium">Expanded extension view</div>
                <div className="text-muted-foreground truncate text-sm">
                  Opened in expanded view. Press Escape or close it to return to the conversation.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" onClick={() => setDisplayMode("inline")}>
                  <IconX />
                  <span className="sr-only">Close expanded MCP app</span>
                </Button>
              </div>
            </div>
            <div className="bg-background h-[calc(100%-4rem)]" />
          </div>
        </>
      )}
      <MCPAppRenderer
        part={part}
        loadResource={loadResource}
        handlers={handlers}
        sandbox={sandbox}
        hostInfo={hostInfo}
        hostContext={{
          theme: resolvedTheme === "dark" ? "dark" : "light",
          displayMode,
          availableDisplayModes: [...DISPLAY_MODES],
          containerDimensions,
          platform: "desktop",
          locale: navigator.language,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          toolInfo: {
            id: part.toolCallId,
            tool: { name: part.toolName, inputSchema: { type: "object" } },
          },
        }}
        fallback={fallback}
      />
    </div>
  );
}
