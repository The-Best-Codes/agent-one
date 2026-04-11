import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type McpAuthState = "logged-in" | "logged-out" | "no-auth" | "supports-oauth" | undefined;

export type McpServerLoadStatus =
  | "unknown"
  | "disabled"
  | "starting"
  | "connecting"
  | "loaded"
  | "error";

export interface McpServerLoadState {
  status: McpServerLoadStatus;
  toolCount: number;
  toolNames: string[];
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
