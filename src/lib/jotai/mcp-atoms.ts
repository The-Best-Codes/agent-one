import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

const mcpServersStorage = createJSONStorage<McpServerConfig[] | undefined>(() => localStorage);
const mcpServersKey = "agent-one-MCP_SERVERS";
const legacyMcpServersKey = "agent-one-setting-MCP_SERVERS";

if (mcpServersStorage.getItem(mcpServersKey, undefined) === undefined) {
  const legacyServers = mcpServersStorage.getItem(legacyMcpServersKey, undefined);
  if (legacyServers !== undefined) {
    mcpServersStorage.setItem(mcpServersKey, legacyServers);
  }
}
mcpServersStorage.removeItem(legacyMcpServersKey);

export const mcpServersAtom = atomWithStorage<McpServerConfig[]>(
  mcpServersKey,
  DEFAULT_SETTINGS.MCP_SERVERS,
  undefined,
  { getOnInit: true },
);

export type McpAuthState = "logged-in" | "logged-out" | "no-auth" | "supports-oauth" | undefined;

export type McpServerLoadStatus =
  | "unknown"
  | "disabled"
  | "starting"
  | "connecting"
  | "loaded"
  | "error";

export interface McpServerToolInfo {
  name: string;
  title?: string;
}

export interface McpServerLoadState {
  status: McpServerLoadStatus;
  toolCount: number;
  toolNames: string[];
  tools?: McpServerToolInfo[];
  error?: string;
}

export const mcpAuthStatesAtom = atom<Record<string, McpAuthState>>({});

export const mcpServerLoadStatesAtom = atom<Record<string, McpServerLoadState>>({});

export const dismissedOAuthPromptsAtom = atomWithStorage<string[]>(
  "agent-one-dismissed-oauth-prompts",
  [],
  undefined,
  { getOnInit: true },
);
