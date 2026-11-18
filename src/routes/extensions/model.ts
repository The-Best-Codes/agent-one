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
      label: "Sign-in needed",
      description:
        authState === "supports-oauth"
          ? "Connect your account for full access."
          : "Connect your account to load this extension's tools.",
    };
  }
  switch (state?.status) {
    case "loaded":
      return {
        tone: "ok",
        label: "Connected",
        description:
          state.toolCount === 0
            ? "Connected, but no tools are available."
            : state.toolCount === 1
              ? "1 tool available."
              : `${state.toolCount} tools available.`,
      };
    case "error":
      return { tone: "error", label: "Error", description: state.error ?? "Unable to load tools." };
    case "starting":
      return { tone: "loading", label: "Starting", description: "Starting the extension." };
    case "connecting":
      return { tone: "loading", label: "Connecting", description: "Connecting to the extension." };
    default:
      return {
        tone: "loading",
        label: "Loading",
        description: "Waiting for the extension to load.",
      };
  }
}
