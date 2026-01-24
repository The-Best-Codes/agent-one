import { UnauthorizedError } from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

import { type McpHttpServerConfig } from "@/lib/settings/types";

import { closeServerCache } from "./index";

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
  serverName: string,
): Promise<boolean> {
  toast.dismiss(`mcp-prompt-login-${serverId}`);

  const toastId = toast.loading(`Starting OAuth flow for ${serverName}...`, {
    action: {
      label: "Cancel",
      onClick: () => toast.dismiss(toastId),
    },
  });

  try {
    await invoke("mcp_authenticate", {
      serverId,
      serverUrl,
    });
    toast.success("Logged in successfully", { id: toastId, action: null });
    closeServerCache(serverId);
    return true;
  } catch (e) {
    toast.error(`Login failed: ${e}`, { id: toastId, action: null });
    return false;
  }
}

export async function mcpLogout(serverId: string): Promise<boolean> {
  try {
    await invoke("mcp_logout", { serverId });
    toast.success("Logged out successfully");
    closeServerCache(serverId);
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
    id: `mcp-prompt-login-${server.id}`,
    description: "Authentication required to access tools.",
    action: {
      label: "Login",
      onClick: () => mcpLogin(server.id, server.url, server.name),
    },
    duration: Infinity,
  });
}
