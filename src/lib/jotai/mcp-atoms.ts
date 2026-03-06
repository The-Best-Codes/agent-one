import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type McpAuthState = "logged-in" | "logged-out" | "no-auth" | "supports-oauth" | undefined;

export const mcpAuthStatesAtom = atom<Record<string, McpAuthState>>({});

export const dismissedOAuthPromptsAtom = atomWithStorage<string[]>(
  "agent-one-dismissed-oauth-prompts",
  [],
  undefined,
  { getOnInit: true },
);
