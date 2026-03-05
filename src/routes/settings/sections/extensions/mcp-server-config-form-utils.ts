import { type McpServerType } from "@/lib/settings/types";

export interface McpServerConfigValidationValues {
  type: McpServerType;
  name: string;
  command: string;
  url: string;
  timeoutSec: number;
}

export function isMcpServerConfigFormValid(
  values: McpServerConfigValidationValues,
): boolean {
  if (!values.name.trim()) {
    return false;
  }

  if (!Number.isFinite(values.timeoutSec) || values.timeoutSec < 0.1) {
    return false;
  }

  return values.type === "stdio"
    ? values.command.trim() !== ""
    : values.url.trim() !== "";
}
