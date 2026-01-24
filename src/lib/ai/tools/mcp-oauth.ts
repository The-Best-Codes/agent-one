import { UnauthorizedError } from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

import { type McpHttpServerConfig } from "@/lib/settings/types";

import { closeServerCache, MCP_TOOLS_REFRESH_EVENT } from "./mcp";

export { UnauthorizedError };

export function isAuthError(error: unknown): boolean {
  if (error instanceof UnauthorizedError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("no credentials found")
    );
  }
  return false;
}

export async function mcpLogin(
  serverId: string,
  serverUrl: string,
): Promise<boolean> {
  const toastId = toast.loading("Starting OAuth flow...");

  try {
    await invoke("mcp_authenticate", {
      serverId,
      serverUrl,
    });
    toast.success("Logged in successfully", { id: toastId });

    closeServerCache(serverId);
    window.dispatchEvent(new CustomEvent(MCP_TOOLS_REFRESH_EVENT));

    return true;
  } catch (e) {
    toast.error(`Login failed: ${e}`, { id: toastId });
    return false;
  }
}

export async function mcpLogout(serverId: string): Promise<boolean> {
  try {
    await invoke("mcp_logout", { serverId });
    toast.success("Logged out successfully");
    closeServerCache(serverId);
    window.dispatchEvent(new CustomEvent(MCP_TOOLS_REFRESH_EVENT));
    return true;
  } catch (e) {
    toast.error(`Logout failed: ${e}`);
    return false;
  }
}

export async function mcpCheckAuth(
  serverId: string,
  serverUrl: string,
): Promise<boolean> {
  try {
    await invoke("mcp_get_token", {
      serverId,
      serverUrl,
    });
    return true;
  } catch {
    return false;
  }
}

export function promptLoginToast(server: McpHttpServerConfig): void {
  toast(`Log in to ${server.name} MCP Server`, {
    description: "Authentication required to access tools.",
    action: {
      label: "Login",
      onClick: () => mcpLogin(server.id, server.url),
    },
    duration: Infinity,
  });
}
