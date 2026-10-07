import { type McpAuthState, type McpServerLoadState } from "@/lib/jotai/mcp-atoms";

export interface ExtensionStatus {
  kind: "off" | "loading" | "ready" | "sign-in" | "error";
  label: string;
  description: string;
}

export function getExtensionStatus(
  enabled: boolean,
  state?: McpServerLoadState,
  authState?: McpAuthState,
): ExtensionStatus {
  if (!enabled) {
    return { kind: "off", label: "Off", description: "Turn it on to use it in your chats." };
  }
  if (state?.status === "error" && (authState === "logged-out" || authState === "supports-oauth")) {
    return {
      kind: "sign-in",
      label: "Sign in needed",
      description: "Connect your account to start using this extension.",
    };
  }
  switch (state?.status) {
    case "loaded":
      return {
        kind: "ready",
        label: "Ready",
        description:
          state.toolCount === 0
            ? "Connected, but it doesn't offer any tools right now."
            : `Ready to use with ${state.toolCount} ${state.toolCount === 1 ? "tool" : "tools"}.`,
      };
    case "error":
      return {
        kind: "error",
        label: "Not working",
        description: state.error || "Something went wrong while starting this extension.",
      };
    default:
      return { kind: "loading", label: "Starting", description: "Starting up..." };
  }
}
