import {
  experimental_createMCPClient as createMCPClient,
  type experimental_MCPClient as MCPClient,
  type JSONRPCMessage,
  type MCPTransport,
} from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { type Child, Command } from "@tauri-apps/plugin-shell";
import type { ToolSet } from "ai";
import { toast } from "sonner";

import { getLogger } from "@/lib/logger";
import { type McpServerConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

interface ManagedMCPServer {
  client: MCPClient;
  transport: MCPTransport;
  tools: ToolSet;
  configHash: string;
}

interface LoadingOperation {
  controller: AbortController;
  promise: Promise<void>;
}

const serverCache = new Map<string, ManagedMCPServer>();
const loadingOperations = new Map<string, LoadingOperation>();

class TauriStdioMCPTransport implements MCPTransport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;

  private childProcess: Child | null = null;
  private commandInstance: Command<string> | null = null;
  private readBuffer = "";
  private command: string;

  constructor(command: string) {
    this.command = command;
  }

  async start(): Promise<void> {
    try {
      const parts = this.command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      this.commandInstance = Command.create(cmd, args);

      this.commandInstance.stdout.on("data", (line: string) => {
        this.readBuffer += line;
        this.processReadBuffer();
      });

      this.commandInstance.stderr.on("data", (line: string) => {
        logger.verbose(`[MCP Server Stderr]: ${line}`);
      });

      this.commandInstance.on("error", (error: string) => {
        const err = new Error(error);
        logger.verbose(`[MCP Server] Command error:`, err);
        this.onerror?.(err);
      });

      this.commandInstance.on(
        "close",
        (data: { code: number | null; signal: number | null }) => {
          logger.verbose(
            `[MCP Server] Closed with code ${data.code} and signal ${data.signal}`,
          );
          this.onclose?.();
        },
      );

      this.childProcess = await this.commandInstance.spawn();
      logger.verbose(`[MCP Server] Spawned with PID: ${this.childProcess.pid}`);
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
    if (!this.childProcess) {
      throw new Error("MCP server process is not running.");
    }
    const messageString = JSON.stringify(message) + "\n";
    await this.childProcess.write(messageString);
  }

  async close(): Promise<void> {
    if (this.childProcess) {
      await this.childProcess.kill();
      this.childProcess = null;
    }
  }
}

class TauriHttpMCPTransport implements MCPTransport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: JSONRPCMessage) => void;

  private url: string;
  private headers: Record<string, string>;
  private sessionId?: string;
  private closed = false;
  private serverId: string;
  private disableOAuth: boolean;
  private token: string | null = null;

  constructor(
    url: string,
    headers: Record<string, string> | undefined,
    serverId: string,
    disableOAuth: boolean | undefined,
  ) {
    this.url = url;
    this.headers = headers || {};
    this.serverId = serverId;
    this.disableOAuth = disableOAuth || false;
  }

  async start(): Promise<void> {
    this.closed = false;
    logger.verbose(`[MCP HTTP] Starting transport for ${this.url}`);

    if (!this.disableOAuth) {
      try {
        const token = await invoke<string>("mcp_get_token", {
          serverId: this.serverId,
          serverUrl: this.url,
        });
        this.token = token;
        logger.verbose(`[MCP HTTP] Acquired OAuth token for ${this.serverId}`);
      } catch (error) {
        logger.verbose(
          `[MCP HTTP] Failed to get OAuth token for ${this.serverId} (this might be normal if not logged in):`,
          error,
        );
        // We don't throw here, we let the request fail with 401 if auth is required
      }
    }
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.closed) {
      throw new Error("Transport is closed");
    }

    try {
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

      logger.verbose(`[MCP HTTP] Sending message:`, message);

      const response = await fetch(this.url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(message),
      });

      const newSessionId = response.headers.get("mcp-session-id");
      if (newSessionId) {
        this.sessionId = newSessionId;
        logger.verbose(`[MCP HTTP] Session ID set to: ${this.sessionId}`);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        const errorText = await response.text();
        throw new Error(
          `HTTP error ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        await this.handleStreamResponse(response);
      } else if (contentType.includes("application/json")) {
        const responseText = await response.text();
        if (responseText.trim()) {
          const responseMessage = JSON.parse(responseText) as JSONRPCMessage;
          logger.verbose(`[MCP HTTP] Received response:`, responseMessage);
          this.onmessage?.(responseMessage);
        }
      } else {
        const responseText = await response.text();
        if (responseText.trim()) {
          try {
            const responseMessage = JSON.parse(responseText) as JSONRPCMessage;
            logger.verbose(`[MCP HTTP] Received response:`, responseMessage);
            this.onmessage?.(responseMessage);
          } catch {
            logger.warn(
              `[MCP HTTP] Could not parse response as JSON:`,
              responseText,
            );
          }
        }
      }
    } catch (error) {
      logger.error(`[MCP HTTP] Error sending message:`, error);
      this.onerror?.(error as Error);
      throw error;
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
                logger.verbose(`[MCP HTTP] Received stream message:`, message);
                this.onmessage?.(message);
              } catch {
                logger.warn(`[MCP HTTP] Failed to parse stream data:`, data);
              }
            }
          } else if (line.trim() && !line.startsWith(":")) {
            try {
              const message = JSON.parse(line) as JSONRPCMessage;
              logger.verbose(`[MCP HTTP] Received JSONL message:`, message);
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
          logger.verbose(`[MCP HTTP] Received final message:`, message);
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
        await fetch(this.url, {
          method: "DELETE",
          headers: {
            "mcp-session-id": this.sessionId,
            ...this.headers,
          },
        });
        logger.verbose(`[MCP HTTP] Session closed: ${this.sessionId}`);
      } catch (error) {
        logger.verbose(`[MCP HTTP] Error closing session:`, error);
      }
    }

    this.onclose?.();
  }
}

function getConfigHash(server: McpServerConfig): string {
  if (server.type === "stdio") {
    return JSON.stringify({ type: "stdio", command: server.command });
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
    return new TauriStdioMCPTransport(server.command);
  } else {
    return new TauriHttpMCPTransport(
      server.url,
      server.headers,
      server.id,
      server.disableOAuth,
    );
  }
}

async function getMcpClientAndTools(
  server: McpServerConfig,
  signal: AbortSignal,
): Promise<{
  client: MCPClient;
  tools: ToolSet;
  transport: MCPTransport;
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
    const client = await createMCPClient({ transport });

    if (signal.aborted) {
      await transport.close();
      throw new Error("Operation aborted");
    }

    const tools = await client.tools();

    if (signal.aborted) {
      await transport.close();
      throw new Error("Operation aborted");
    }

    const serverTypeLabel = server.type === "stdio" ? "STDIO" : "HTTP";
    logger.verbose(
      `Successfully fetched MCP tools for ${server.name} (${serverTypeLabel}):`,
      Object.keys(tools),
    );

    signal.removeEventListener("abort", onAbort);
    return { client, tools, transport };
  } catch (error) {
    signal.removeEventListener("abort", onAbort);
    throw error;
  }
}

async function handleLogin(server: McpServerConfig) {
  if (server.type !== "http") return;

  const toastId = toast.loading("Starting OAuth flow...");

  try {
    await invoke("mcp_authenticate", {
      serverId: server.id,
      serverUrl: server.url,
    });
    toast.success("Logged in successfully", { id: toastId });

    // Invalidate cache so next retry works
    closeServerCache(server.id);

    toast.info("Please refresh or retry the operation.", { duration: 5000 });
  } catch (e) {
    toast.error(`Login failed: ${e}`, { id: toastId });
  }
}

export async function getMcpToolsForServer(
  server: McpServerConfig,
): Promise<ToolSet> {
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
    await existingLoad.promise;
    return serverCache.get(server.id)?.tools || {};
  }

  const controller = new AbortController();

  const promise = (async () => {
    try {
      const result = await getMcpClientAndTools(server, controller.signal);
      serverCache.set(server.id, { ...result, configHash });
    } finally {
      loadingOperations.delete(server.id);
    }
  })();

  loadingOperations.set(server.id, { controller, promise });

  try {
    await promise;
    return serverCache.get(server.id)?.tools || {};
  } catch (error) {
    logger.warn(`Failed to initialize MCP client for ${server.name}:`, error);

    if (
      server.type === "http" &&
      !server.disableOAuth &&
      ((error instanceof Error && error.message.includes("Unauthorized")) ||
        (error instanceof Error && error.message.includes("401")) ||
        (error instanceof Error &&
          error.message.includes("No credentials found")))
    ) {
      toast(`Log in to ${server.name} MCP Server`, {
        description: "Authentication required to access tools.",
        action: {
          label: "Login",
          onClick: () => handleLogin(server),
        },
        duration: Infinity,
      });
    }

    return {};
  }
}

export function closeServerCache(serverId: string): void {
  const loading = loadingOperations.get(serverId);
  if (loading) {
    loading.controller.abort();
    loadingOperations.delete(serverId);
  }

  const cached = serverCache.get(serverId);
  if (cached) {
    cached.transport.close().catch((error) => {
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
    cached.transport.close().catch((error) => {
      logger.error("Error closing MCP server:", error);
    });
  }
  serverCache.clear();
}
