import { atom } from "jotai";

export type McpAuthState = "logged-in" | "logged-out" | "no-auth" | undefined;

export const mcpAuthStatesAtom = atom<Record<string, McpAuthState>>({});
