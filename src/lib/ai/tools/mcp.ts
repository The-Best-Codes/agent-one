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
    // In most cases I've seen, MCP messages are newline-delimited JSON
    // This could be a potential cause of MCP-related bugs in the future,
    // so play around with the code below if any issues arise
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
    // See comments in the `processReadBuffer` method
    // MCP expects newline-delimited JSON
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

async function getMcpClient(command: string): Promise<MCPClient> {
  const transport = new TauriStdioMCPTransport(command);
  const client = await createMCPClient({ transport });
  return client;
}

export async function getMcpToolsForServer(
  server: McpServerConfig,
): Promise<ToolSet> {
  try {
    const client = await getMcpClient(server.command);
    const tools = await client.tools();
    logger.verbose(
      `Successfully fetched MCP tools for ${server.name}:`,
      Object.keys(tools),
    );
    return tools;
  } catch (error) {
    logger.warn(`Failed to initialize MCP client for ${server.name}:`, error);
    return {};
  }
}

// TODO: Ensure this is invoked where it should be!
// export async function closeMcpClient(): Promise<void> {
//   if (mcpClient) {
//     try {
//       await mcpClient.close();
//       logger.verbose("MCP client closed successfully");
//     } catch (error) {
//       logger.error("Error closing MCP client:", error);
//     } finally {
//       mcpClient = null;
//       mcpToolsCache = null;
//     }
//   }
// }
