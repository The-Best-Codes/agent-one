import { UnauthorizedError } from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { getDefaultStore } from "jotai";
import { toast } from "sonner";

import { mcpAuthStatesAtom } from "@/lib/jotai/mcp-atoms";
import { dismissedOAuthPromptsAtom } from "@/lib/jotai/unsynced-local-atoms";
import { getLogger } from "@/lib/logger";
import { type McpHttpServerConfig } from "@/lib/settings/types";

import { closeServerCache } from "./index";

const store = getDefaultStore();

const logger = getLogger(import.meta.url);

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

export async function checkOAuthSupport(serverUrl: string): Promise<boolean> {
  try {
    return await invoke<boolean>("mcp_check_oauth_support", { serverUrl });
  } catch (e) {
    logger.verbose("Failed to check OAuth support:", e);
    return false;
  }
}

export function dismissMcpLoginToasts(serverId: string): void {
  toast.dismiss(`mcp-prompt-login-${serverId}`);
  toast.dismiss(`mcp-soft-login-${serverId}`);
}

export function clearMcpOAuthCredentials(serverId: string): Promise<void> {
  return invoke("mcp_logout", { serverId });
}

export interface McpOAuthClient {
  clientId: string;
  hasSecret: boolean;
}

export async function getMcpOAuthClient(serverId: string): Promise<McpOAuthClient | null> {
  return invoke<McpOAuthClient | null>("mcp_get_oauth_client", { serverId });
}

export async function setMcpOAuthClient(
  serverId: string,
  clientId: string,
  clientSecret?: string,
): Promise<void> {
  await invoke("mcp_set_oauth_client", { serverId, clientId, clientSecret });
  closeServerCache(serverId);
}

const pendingLogins = new Map<string, Promise<boolean>>();

export function mcpLogin(
  serverId: string,
  serverUrl: string,
  serverName: string,
): Promise<boolean> {
  const pending = pendingLogins.get(serverId);
  if (pending) return pending;
  const login = runMcpLogin(serverId, serverUrl, serverName).finally(() => {
    pendingLogins.delete(serverId);
  });
  pendingLogins.set(serverId, login);
  return login;
}

async function runMcpLogin(
  serverId: string,
  serverUrl: string,
  serverName: string,
): Promise<boolean> {
  dismissMcpLoginToasts(serverId);

  const toastId = toast.loading(`Signing in to your ${serverName} account...`, {
    action: {
      label: "Cancel",
      onClick: async (event) => {
        event.preventDefault();
        toast.loading(`Cancelling sign-in to ${serverName}...`, {
          id: toastId,
          action: null,
          duration: Infinity,
        });
        try {
          await invoke("mcp_cancel_auth", { serverId });
        } catch (e) {
          logger.error("Failed to cancel auth", e);
        }
      },
    },
  });

  try {
    await invoke("mcp_authenticate", {
      serverId,
      serverUrl,
    });
    toast.success(`Signed in to your ${serverName} account`, {
      id: toastId,
      action: null,
    });
    store.set(mcpAuthStatesAtom, (prev) => {
      if (prev[serverId] === "logged-in") return prev;
      return {
        ...prev,
        [serverId]: "logged-in",
      };
    });
    closeServerCache(serverId);
    return true;
  } catch (e) {
    if (typeof e === "string" && e.includes("Authorization cancelled")) {
      toast.error(`Sign-in to ${serverName} cancelled`, {
        id: toastId,
        action: null,
        duration: 10_000,
      });
    } else {
      toast.error(`Couldn't sign in to ${serverName}: ${String(e)}`, {
        id: toastId,
        action: null,
        duration: 10_000,
      });
    }
    return false;
  }
}

export async function mcpLogout(serverId: string, serverName: string): Promise<boolean> {
  try {
    await clearMcpOAuthCredentials(serverId);
    toast.success(`Signed out of your ${serverName} account`);
    closeServerCache(serverId);
    store.set(mcpAuthStatesAtom, (prev) => {
      if (!(serverId in prev)) return prev;
      const next = { ...prev };
      delete next[serverId];
      return next;
    });
    return true;
  } catch (e) {
    toast.error(`Couldn't sign out of ${serverName}: ${String(e)}`);
    return false;
  }
}

export async function mcpCheckAuth(
  serverId: string,
  serverUrl: string,
): Promise<"logged-in" | undefined> {
  try {
    await invoke("mcp_get_token", {
      serverId,
      serverUrl,
    });
    store.set(mcpAuthStatesAtom, (prev) => {
      if (prev[serverId] === "logged-in") return prev;
      return {
        ...prev,
        [serverId]: "logged-in",
      };
    });
    return "logged-in";
  } catch (error) {
    logger.debug(`No valid token for MCP server ${serverId}`, error);
    return undefined;
  }
}

export function promptLoginToast(server: McpHttpServerConfig): void {
  toast(`Sign in to your ${server.name} account`, {
    id: `mcp-prompt-login-${server.id}`,
    description: "This extension is installed, but it needs your account before it can work.",
    action: {
      label: "Sign in",
      onClick: () => mcpLogin(server.id, server.url, server.name),
    },
    duration: Infinity,
  });
}

export function promptSoftLoginToast(server: McpHttpServerConfig): void {
  const dismissed = store.get(dismissedOAuthPromptsAtom);
  if (dismissed.includes(server.id)) {
    return;
  }

  toast(`Sign in to your ${server.name} account for full access`, {
    description: "This extension works without it, but signing in unlocks more.",
    id: `mcp-soft-login-${server.id}`,
    action: {
      label: "Sign in",
      onClick: () => mcpLogin(server.id, server.url, server.name),
    },
    cancel: {
      label: "Never",
      onClick: () => {
        store.set(dismissedOAuthPromptsAtom, (prev) => {
          if (prev.includes(server.id)) return prev;
          return [...prev, server.id];
        });
      },
    },
    cancelButtonStyle: {
      color: "white",
      backgroundColor: "var(--color-destructive)",
    },
    duration: Infinity,
  });
}
