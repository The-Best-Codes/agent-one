import { type McpServerLoadState } from "@/lib/jotai/mcp-atoms";

export function getMcpServerStatusTooltip(state?: McpServerLoadState, disabled?: boolean): string {
  if (disabled) {
    return "Disabled";
  }

  switch (state?.status) {
    case "loaded":
      return state.toolCount === 1
        ? "Loaded successfully with 1 tool"
        : `Loaded successfully with ${state?.toolCount ?? 0} tools`;
    case "error":
      return state.error ? `Error: ${state.error}` : "Error";
    case "starting":
      return "Starting";
    case "connecting":
      return "Connecting";
    case "disabled":
      return "Disabled";
    case "unknown":
    default:
      return "Unknown";
  }
}
