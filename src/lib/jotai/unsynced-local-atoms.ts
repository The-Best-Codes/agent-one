import { atomWithStorage, createJSONStorage } from "jotai/utils";

import { DEFAULT_SETTINGS, type McpServerConfig } from "@/lib/settings/types";

function createNoSyncStorage<T>() {
  const storage = createJSONStorage<T>(() => localStorage);
  delete storage.subscribe;
  return storage;
}

const mcpServersStorage = createNoSyncStorage<McpServerConfig[] | undefined>();
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
  createNoSyncStorage<McpServerConfig[]>(),
  { getOnInit: true },
);

export const sidebarCollapsedAtom = atomWithStorage(
  "agent-one-sidebar-collapsed",
  false,
  createNoSyncStorage<boolean>(),
  { getOnInit: true },
);

export const debugModeEnabledAtom = atomWithStorage<boolean>(
  "agent-one-debug-mode",
  false,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);

export const reactScanEnabledAtom = atomWithStorage<boolean>(
  "agent-one-react-scan-enabled",
  false,
  createJSONStorage(() => sessionStorage),
  { getOnInit: true },
);
