import {
  createMCPClient,
  type JSONRPCMessage,
  type ListToolsResult,
  mcpAppClientCapabilities,
  type MCPAppResource,
  type MCPClient,
  type MCPTransport,
  readMCPAppResource,
  splitMCPAppTools,
  UnauthorizedError,
} from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { Tool, ToolSet } from "ai";
import { getDefaultStore } from "jotai";

import { mcpAuthStatesAtom } from "@/lib/jotai/mcp-atoms";
import { getLogger } from "@/lib/logger";
import { spawnCommand, type RunCommandHandle } from "@/lib/run-command";
import { type McpHttpServerConfig, type McpServerConfig } from "@/lib/settings/types";

import { checkOAuthSupport, isAuthError, promptLoginToast, promptSoftLoginToast } from "./oauth";

const store = getDefaultStore();

const logger = getLogger(import.meta.url);

interface ManagedMCPServer {
  client?: MCPClient;
  transport?: MCPTransport;
  tools: ToolSet;
  appVisibleToolNames: string[];
  configHash: string;
}

interface LoadingOperation {
  controller: AbortController;
  configHash: string;
  promise: Promise<void>;
}

const serverCache = new Map<string, ManagedMCPServer>();
const loadingOperations = new Map<string, LoadingOperation>();
const appResourceCache = new Map<string, Map<string, Promise<MCPAppResource>>>();

class TauriStdioMCPTransport implements MCPTransport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;

  private handle: RunCommandHandle | null = null;
  private readBuffer = "";
  private command: string;
  private env: Record<string, string>;

  constructor(command: string, env: Record<string, string>) {
    this.command = command;
    this.env = env;
  }

  async start(): Promise<void> {
    try {
      const { handle, result } = spawnCommand(this.command, {
        env: this.env,
        onStdout: (data) => {
          this.readBuffer += data;
          this.processReadBuffer();
        },
        onStderr: (data) => {
          logger.verbose(`MCP Server Stderr: ${data}`);
        },
      });

      this.handle = handle;

      result
        .then((r) => {
          logger.verbose(`MCP Server Closed with code ${r.exitCode} and signal ${r.signal}`);
          this.onclose?.();
        })
        .catch((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.verbose(`MCP Server Command error:`, err);
          this.onerror?.(err);
        });
    } catch (error) {
      logger.warn("Failed to start MCP server:", error);
      this.onerror?.(error as Error);
      throw error;
    }
  }

  private processReadBuffer() {
    let newlineIndex;
    while ((newlineIndex = this.readBuffer.indexOf("\n")) >= 0) {
      const line = this.readBuffer.slice(0, newlineIndex);
      this.readBuffer = this.readBuffer.slice(newlineIndex + 1);

      if (line.trim() === "") continue;

      try {
        const message = JSON.parse(line) as JSONRPCMessage;
        this.onmessage?.(message);
      } catch (error) {
        logger.warn("Failed to parse MCP message:", line, error);
        this.onerror?.(error as Error);
      }
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.handle) {
      throw new Error("MCP server process is not running.");
    }
    await this.handle.write(JSON.stringify(message) + "\n");
  }

  async close(): Promise<void> {
    if (this.handle) {
      await this.handle.kill();
      this.handle = null;
    }
  }
}

class TauriHttpMCPTransport implements MCPTransport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;
  public hasToken = false;

  private url: string;
  private headers: Record<string, string>;
  private sessionId?: string;
  private closed = false;
  private serverId: string;
  private token: string | null = null;

  constructor(url: string, headers: Record<string, string> | undefined, serverId: string) {
    this.url = url;
    this.headers = headers || {};
    this.serverId = serverId;
  }

  async start(): Promise<void> {
    this.closed = false;
    logger.verbose(`Starting HTTP MCP transport for ${this.url}`);

    try {
      const token = await invoke<string>("mcp_get_token", {
        serverId: this.serverId,
        serverUrl: this.url,
      });
      this.token = token;
      this.hasToken = true;
      logger.verbose(`Acquired OAuth token for ${this.serverId}`);
    } catch (error) {
      this.hasToken = false;
      logger.verbose(`Failed to get OAuth token for ${this.serverId}:`, error);
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.closed) {
      throw new Error("Transport is closed");
    }

    try {
      logger.verbose(`Sending HTTP MCP message:`, message);

      let response = await this.sendHttpRequest(message);

      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          throw new UnauthorizedError();
        }

        logger.verbose(`Retrying HTTP MCP message after token refresh`);
        response = await this.sendHttpRequest(message);

        if (response.status === 401) {
          throw new UnauthorizedError();
        }
      }

      await this.handleHttpResponse(response);
    } catch (error) {
      logger.error(`HTTP MCP Error sending message:`, error);
      this.onerror?.(error as Error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const token = await invoke<string>("mcp_get_token", {
        serverId: this.serverId,
        serverUrl: this.url,
      });
      this.token = token;
      this.hasToken = true;
      return true;
    } catch (error) {
      this.hasToken = false;
      logger.verbose(`Failed to refresh OAuth token for ${this.serverId}:`, error);
      return false;
    }
  }

  private async sendHttpRequest(message: JSONRPCMessage): Promise<Response> {
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...this.headers,
    };

    if (this.sessionId) {
      requestHeaders["mcp-session-id"] = this.sessionId;
    }

    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await tauriFetch(this.url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(message),
    });

    const newSessionId = response.headers.get("mcp-session-id");
    if (newSessionId) {
      this.sessionId = newSessionId;
      logger.verbose(`HTTP MCP Session ID set to: ${this.sessionId}`);
    }

    return response;
  }

  private async handleHttpResponse(response: Response): Promise<void> {
    if (!response.ok) {
      if (response.status === 401) {
        throw new UnauthorizedError();
      }
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      await this.handleStreamResponse(response);
      return;
    }

    const responseText = await response.text();
    if (!responseText.trim()) {
      return;
    }

    try {
      const responseMessage = JSON.parse(responseText) as JSONRPCMessage;
      logger.verbose(`HTTP MCP Received response:`, responseMessage);
      this.onmessage?.(responseMessage);
    } catch {
      logger.warn(`HTTP MCP Could not parse response as JSON:`, responseText);
    }
  }

  private async handleStreamResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader available");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data && data !== "[DONE]") {
              try {
                const message = JSON.parse(data) as JSONRPCMessage;
                logger.verbose(`HTTP MCP Received stream message:`, message);
                this.onmessage?.(message);
              } catch {
                logger.warn(`HTTP MCP Failed to parse stream data:`, data);
              }
            }
          } else if (line.trim() && !line.startsWith(":")) {
            try {
              const message = JSON.parse(line) as JSONRPCMessage;
              logger.verbose(`HTTP MCP Received JSONL message:`, message);
              this.onmessage?.(message);
            } catch {
              // Not JSON, might be a comment or other format
            }
          }
        }
      }

      if (buffer.trim()) {
        try {
          const message = JSON.parse(buffer) as JSONRPCMessage;
          logger.verbose(`HTTP MCP Received final message:`, message);
          this.onmessage?.(message);
        } catch {
          // Ignore final buffer that cannot be parsed
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async close(): Promise<void> {
    this.closed = true;

    if (this.sessionId) {
      try {
        await tauriFetch(this.url, {
          method: "DELETE",
          headers: {
            "mcp-session-id": this.sessionId,
            ...this.headers,
          },
        });
        logger.verbose(`HTTP MCP Session closed: ${this.sessionId}`);
      } catch (error) {
        logger.verbose(`Error closing HTTP MCP session:`, error);
      }
    }

    this.onclose?.();
  }
}

function getConfigHash(server: McpServerConfig): string {
  if (server.type === "stdio") {
    return JSON.stringify({
      type: "stdio",
      command: server.command,
      env: server.env,
    });
  } else {
    return JSON.stringify({
      type: "http",
      url: server.url,
      headers: server.headers,
    });
  }
}

function createTransport(server: McpServerConfig): MCPTransport {
  if (server.type === "stdio") {
    return new TauriStdioMCPTransport(server.command, server.env);
  } else {
    return new TauriHttpMCPTransport(server.url, server.headers, server.id);
  }
}

async function getPaginatedMcpToolDefinitions(
  client: MCPClient,
  signal: AbortSignal,
): Promise<ListToolsResult> {
  if (signal.aborted) {
    throw new Error("Operation aborted");
  }

  const firstPage = await client.listTools({ options: { signal } });
  const allToolDefinitions = [...firstPage.tools];
  const seenCursors = new Set<string>();
  let cursor = firstPage.nextCursor;

  while (cursor) {
    if (signal.aborted) {
      throw new Error("Operation aborted");
    }

    if (seenCursors.has(cursor)) {
      throw new Error("MCP server returned a duplicate pagination cursor while listing tools.");
    }

    seenCursors.add(cursor);

    const page = await client.listTools({
      params: { cursor },
      options: { signal },
    });

    allToolDefinitions.push(...page.tools);
    cursor = page.nextCursor;
  }

  return {
    ...firstPage,
    tools: allToolDefinitions,
    nextCursor: undefined,
  };
}

async function getMcpClientAndTools(
  server: McpServerConfig,
  signal: AbortSignal,
): Promise<{
  client: MCPClient;
  tools: ToolSet;
  appVisibleToolNames: string[];
  transport: MCPTransport;
  hasToken: boolean;
}> {
  if (signal.aborted) {
    throw new Error("Operation aborted");
  }

  const transport = createTransport(server);

  const onAbort = () => {
    transport.close().catch((error) => {
      logger.error(`Error closing aborted MCP server ${server.id}:`, error);
    });
  };

  signal.addEventListener("abort", onAbort, { once: true });

  try {
    const client = await createMCPClient({
      transport,
      clientName: "agent-one",
      capabilities: mcpAppClientCapabilities,
    });

    if (signal.aborted) {
      await transport.close();
      throw new Error("Operation aborted");
    }

    const definitions = await getPaginatedMcpToolDefinitions(client, signal);
    const { modelVisible, appVisible } = splitMCPAppTools(definitions);
    const tools = client.toolsFromDefinitions(modelVisible);
    const appVisibleToolNames = appVisible.tools.map((tool) => tool.name);

    if (signal.aborted) {
      await transport.close();
      throw new Error("Operation aborted");
    }

    const serverTypeLabel = server.type === "stdio" ? "STDIO" : "HTTP";
    logger.verbose(
      `Successfully fetched MCP tools for ${server.name} (${serverTypeLabel}):`,
      Object.keys(tools),
    );

    const hasToken = transport instanceof TauriHttpMCPTransport ? transport.hasToken : false;

    signal.removeEventListener("abort", onAbort);
    return { client, tools, appVisibleToolNames, transport, hasToken };
  } catch (error) {
    signal.removeEventListener("abort", onAbort);
    throw error;
  }
}

export async function getMcpToolsForServer(server: McpServerConfig): Promise<ToolSet> {
  const configHash = getConfigHash(server);
  const cached = serverCache.get(server.id);

  if (cached && cached.configHash === configHash) {
    return cached.tools;
  }

  if (cached && cached.configHash !== configHash) {
    closeServerCache(server.id);
  }

  const existingLoad = loadingOperations.get(server.id);
  if (existingLoad) {
    if (existingLoad.configHash !== configHash) {
      abortMcpServerLoad(server.id);
    } else {
      await existingLoad.promise;
      return serverCache.get(server.id)?.tools || {};
    }
  }

  const controller = new AbortController();

  const promise = (async () => {
    try {
      const result = await getMcpClientAndTools(server, controller.signal);
      serverCache.set(server.id, { ...result, configHash });

      if (server.type === "http") {
        if (result.hasToken) {
          store.set(mcpAuthStatesAtom, (prev) => {
            if (prev[server.id] === "logged-in") return prev;
            return { ...prev, [server.id]: "logged-in" };
          });
        } else {
          void checkOAuthSupport(server.url).then((supportsOAuth) => {
            if (supportsOAuth) {
              store.set(mcpAuthStatesAtom, (prev) => {
                if (prev[server.id] === "supports-oauth") return prev;
                return { ...prev, [server.id]: "supports-oauth" };
              });
              promptSoftLoginToast(server as McpHttpServerConfig);
            } else {
              store.set(mcpAuthStatesAtom, (prev) => {
                if (prev[server.id] === "no-auth") return prev;
                return { ...prev, [server.id]: "no-auth" };
              });
            }
          });
        }
      }
    } finally {
      loadingOperations.delete(server.id);
    }
  })();

  loadingOperations.set(server.id, { controller, configHash, promise });

  try {
    await promise;
    return serverCache.get(server.id)?.tools || {};
  } catch (error) {
    logger.warn(`Failed to initialize MCP client for ${server.name}:`, error);
    let normalizedError = error instanceof Error ? error : new Error("Unknown error");

    if (server.type === "http" && isAuthError(error)) {
      const supportsOAuth = await checkOAuthSupport(server.url);

      if (supportsOAuth) {
        store.set(mcpAuthStatesAtom, (prev) => {
          if (prev[server.id] === "logged-out") return prev;
          return { ...prev, [server.id]: "logged-out" };
        });
        promptLoginToast(server as McpHttpServerConfig);
        normalizedError = new Error("Authentication required. Log in to load tools.");
      } else {
        logger.warn(
          `MCP server ${server.name} returned an auth error but does not appear to support OAuth`,
        );
        normalizedError = new Error("Authentication failed while loading tools.");
      }
    }

    throw normalizedError;
  }
}

export function abortMcpServerLoad(serverId: string): void {
  const loading = loadingOperations.get(serverId);
  if (loading) {
    loading.controller.abort();
    loadingOperations.delete(serverId);
  }
}

export function isServerCached(server: McpServerConfig): boolean {
  const cached = serverCache.get(server.id);
  return cached !== undefined && cached.configHash === getConfigHash(server);
}

export function closeServerCache(serverId: string): void {
  abortMcpServerLoad(serverId);
  appResourceCache.delete(serverId);

  const cached = serverCache.get(serverId);
  if (cached) {
    cached.transport?.close().catch((error) => {
      logger.error(`Error closing MCP server ${serverId}:`, error);
    });
    serverCache.delete(serverId);
  }
}

export function invalidateServerCache(): void {
  for (const [, loading] of loadingOperations) {
    loading.controller.abort();
  }
  loadingOperations.clear();
  for (const [, cached] of serverCache) {
    cached.transport?.close().catch((error) => {
      logger.error("Error closing MCP server:", error);
    });
  }
  serverCache.clear();
  appResourceCache.clear();
}

const MCP_TOOL_PREFIX = "mcp__";
const MCP_TOOL_SEPARATOR = "__";
export const MCP_SERVER_ID_METADATA_KEY = "agentOneMcpServerId";

function createAbortError(): Error {
  const abortError = new Error("The operation was aborted.");
  abortError.name = "AbortError";
  return abortError;
}

function wrapMcpToolWithAbortRace(tool: Tool<unknown, unknown>): Tool<unknown, unknown> {
  if (!tool.execute) {
    return tool;
  }

  return {
    ...tool,
    execute: async (input, options) => {
      const abortSignal = options.abortSignal;

      if (!abortSignal) {
        return tool.execute!(input, options);
      }

      if (abortSignal.aborted) {
        throw createAbortError();
      }

      let onAbort: (() => void) | undefined;
      const abortPromise = new Promise<never>((_, reject) => {
        onAbort = () => {
          reject(createAbortError());
        };
        abortSignal.addEventListener("abort", onAbort, { once: true });
      });

      try {
        return await Promise.race([tool.execute!(input, options), abortPromise]);
      } finally {
        if (onAbort) {
          abortSignal.removeEventListener("abort", onAbort);
        }
      }
    },
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildMcpServerSlugMap(servers: McpServerConfig[]): Map<string, string> {
  const slugCounts = new Map<string, number>();
  const slugMap = new Map<string, string>();

  for (const server of servers) {
    const base = slugify(server.name) || "mcp-server";
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    slugMap.set(server.id, slug);
  }

  return slugMap;
}

export function prefixMcpToolNames(tools: ToolSet, serverSlug: string, serverId: string): ToolSet {
  const prefixed: ToolSet = {};
  for (const [name, tool] of Object.entries(tools)) {
    const wrappedTool = wrapMcpToolWithAbortRace(tool as Tool<unknown, unknown>);
    prefixed[`${MCP_TOOL_PREFIX}${serverSlug}${MCP_TOOL_SEPARATOR}${name}`] = {
      ...wrappedTool,
      metadata: {
        ...wrappedTool.metadata,
        [MCP_SERVER_ID_METADATA_KEY]: serverId,
      },
    };
  }
  return prefixed;
}

function getCachedMcpAppServer(serverId: string): ManagedMCPServer & { client: MCPClient } {
  const server = serverCache.get(serverId);
  if (!server?.client) {
    throw new Error("The MCP server is no longer connected.");
  }
  return server as ManagedMCPServer & { client: MCPClient };
}

export function getMcpAppVisibleToolNames(serverId: string): string[] {
  return [...getCachedMcpAppServer(serverId).appVisibleToolNames];
}

export async function loadMcpAppResource(serverId: string, uri: string): Promise<MCPAppResource> {
  const server = getCachedMcpAppServer(serverId);
  let serverResources = appResourceCache.get(serverId);
  if (!serverResources) {
    serverResources = new Map();
    appResourceCache.set(serverId, serverResources);
  }

  const cached = serverResources.get(uri);
  if (cached) {
    return cached;
  }

  const resource = readMCPAppResource({ client: server.client, uri });
  serverResources.set(uri, resource);

  try {
    return await resource;
  } catch (error) {
    serverResources.delete(uri);
    throw error;
  }
}

export async function callMcpAppTool(
  serverId: string,
  name: string,
  toolArguments?: Record<string, unknown>,
) {
  const server = getCachedMcpAppServer(serverId);
  if (!server.appVisibleToolNames.includes(name)) {
    throw new Error(`Tool is not app-visible: ${name}`);
  }

  return server.client.callTool({ name, arguments: toolArguments ?? {} });
}

export function readMcpAppServerResource(serverId: string, uri: string) {
  return getCachedMcpAppServer(serverId).client.readResource({ uri });
}

export function stripMcpToolPrefix(toolName: string): string {
  if (!toolName.startsWith(MCP_TOOL_PREFIX)) {
    return toolName;
  }
  const withoutPrefix = toolName.slice(MCP_TOOL_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf(MCP_TOOL_SEPARATOR);
  if (separatorIndex === -1) {
    return toolName;
  }
  return withoutPrefix.slice(separatorIndex + MCP_TOOL_SEPARATOR.length);
}

export function getToolDisplayName(toolName: string, title?: string): string {
  return title || stripMcpToolPrefix(toolName);
}
