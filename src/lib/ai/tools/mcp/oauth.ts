import { UnauthorizedError } from "@ai-sdk/mcp";
import { invoke } from "@tauri-apps/api/core";
import { getDefaultStore } from "jotai";
import { toast } from "sonner";

import { dismissedOAuthPromptsAtom, mcpAuthStatesAtom } from "@/lib/jotai/mcp-atoms";
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

export async function mcpLogin(
  serverId: string,
  serverUrl: string,
  serverName: string,
): Promise<boolean> {
  dismissMcpLoginToasts(serverId);

  const toastId = toast.loading(`Connecting AgentOne to "${serverName}"...`, {
    action: {
      label: "Cancel",
      onClick: async (event) => {
        event.preventDefault();
        toast.loading(`Cancelling connection to "${serverName}"...`, {
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
    toast.success(`Connected to "${serverName}" successfully`, { id: toastId, action: null });
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
      toast.error(`Connection to "${serverName}" cancelled`, {
        id: toastId,
        action: null,
        duration: 10_000,
      });
    } else {
      toast.error(`Connection failed: ${String(e)}`, {
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
    toast.success(`Disconnected from "${serverName}" successfully`);
    store.set(mcpAuthStatesAtom, (prev) => {
      if (prev[serverId] === "logged-out") return prev;
      return {
        ...prev,
        [serverId]: "logged-out",
      };
    });
    closeServerCache(serverId);
    return true;
  } catch (e) {
    toast.error(`Failed to disconnect from "${serverName}": ${String(e)}`);
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
  } catch {
    return undefined;
  }
}

export function promptLoginToast(server: McpHttpServerConfig): void {
  toast(`Connect to the "${server.name}" Extension`, {
    id: `mcp-prompt-login-${server.id}`,
    description: "Authentication required to access tools.",
    action: {
      label: "Connect",
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

  toast(`Connect to the "${server.name}" Extension for full access`, {
    id: `mcp-soft-login-${server.id}`,
    action: {
      label: "Connect",
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
