import { useCallback } from "react";
import { useSearchParams } from "react-router";

import type { McpAuthState, McpServerLoadState } from "@/lib/jotai/mcp-atoms";

export function getExtensionPath(serverId: string): string {
  return `/extensions/view/${serverId.split("/").map(encodeURIComponent).join("/")}`;
}

export function useExtensionsLink() {
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get("chatId");
  return useCallback(
    (path: string) => (chatId ? `${path}?${new URLSearchParams({ chatId }).toString()}` : path),
    [chatId],
  );
}

export type ServerStatusTone = "ok" | "warn" | "error" | "off" | "loading";

export interface ServerStatus {
  tone: ServerStatusTone;
  label: string;
  description: string;
}

export function getServerStatus(
  state: McpServerLoadState | undefined,
  authState: McpAuthState,
  enabled: boolean,
): ServerStatus {
  if (!enabled) {
    return { tone: "off", label: "Off", description: "Turn this extension on to use its tools." };
  }
  if (state?.status === "error" && (authState === "logged-out" || authState === "supports-oauth")) {
    return {
      tone: "warn",
      label: "Sign in needed",
      description: "Sign in to your account to use this extension.",
    };
  }
  if (state?.status === "loaded") {
    return {
      tone: "ok",
      label: "Connected",
      description:
        state.toolCount === 0
          ? "No tools available"
          : state.toolCount === 1
            ? "1 tool available"
            : `${state.toolCount} tools available`,
    };
  }
  if (state?.status === "error") {
    return {
      tone: "error",
      label: "Couldn't connect",
      description: state.error ?? "Unable to load tools.",
    };
  }
  return { tone: "loading", label: "Connecting", description: "Getting this extension ready." };
}
