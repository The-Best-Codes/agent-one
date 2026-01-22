import {
  experimental_createMCPClient as createMCPClient,
  type experimental_MCPClient as MCPClient,
  type JSONRPCMessage,
  type MCPTransport,
} from "@ai-sdk/mcp";
import { type Child, Command } from "@tauri-apps/plugin-shell";
import type { ToolSet } from "ai";

import { getLogger } from "@/lib/logger";
import { type McpServerConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

interface ManagedMCPServer {
  client: MCPClient;
  transport: TauriStdioMCPTransport;
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

function getConfigHash(server: McpServerConfig): string {
  return JSON.stringify({ command: server.command });
}

async function getMcpClientAndTools(
  server: McpServerConfig,
  signal: AbortSignal,
): Promise<{
  client: MCPClient;
  tools: ToolSet;
  transport: TauriStdioMCPTransport;
}> {
  if (signal.aborted) {
    throw new Error("Operation aborted");
  }

  const transport = new TauriStdioMCPTransport(server.command);

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

    logger.verbose(
      `Successfully fetched MCP tools for ${server.name}:`,
      Object.keys(tools),
    );

    signal.removeEventListener("abort", onAbort);
    return { client, tools, transport };
  } catch (error) {
    signal.removeEventListener("abort", onAbort);
    throw error;
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
