import { arch, platform, version } from "@tauri-apps/plugin-os";
import type { LanguageModel } from "ai";

import packageJson from "@/../package.json";

export type AgentOneRequestType =
  | "chat"
  | "title-generation"
  | "compaction"
  | "sub-agent"
  | "auto-mode"
  | "analyze-file";

export interface AgentOneRequestMetadata {
  type: AgentOneRequestType;
  chatId?: string;
  trigger?: string;
  parentTurnId?: string;
}

const SESSION_ID = crypto.randomUUID();

function safe(get: () => string | null | undefined): string {
  try {
    return get() || "unknown";
  } catch {
    return "unknown";
  }
}

const OS_PLATFORM = safe(platform);
const OS_ARCH = safe(arch);
const OS_VERSION = safe(version);

export const AGENT_ONE_CLIENT_HEADERS: Record<string, string> = {
  "X-AgentOne-Client": "agent-one-desktop",
  "X-AgentOne-Version": packageJson.version,
  "X-AgentOne-Platform": OS_PLATFORM,
  "X-AgentOne-Arch": OS_ARCH,
  "X-AgentOne-OS-Version": OS_VERSION,
  "X-AgentOne-Session-Id": SESSION_ID,
};

export function isAgentOneModel(model: LanguageModel | null | undefined): boolean {
  return typeof model === "object" && model !== null && model.provider.startsWith("agent-one.");
}

export function createAgentOneTurnId(): string {
  return crypto.randomUUID();
}

export function getAgentOneRequestHeaders(
  model: LanguageModel | null | undefined,
  metadata: AgentOneRequestMetadata,
  turnId: string = createAgentOneTurnId(),
): Record<string, string> | undefined {
  if (!isAgentOneModel(model)) {
    return undefined;
  }

  const headers: Record<string, string> = {
    "X-AgentOne-Request-Type": metadata.type,
    "X-AgentOne-Turn-Id": turnId,
    "X-AgentOne-Locale": navigator.language,
  };

  if (metadata.chatId) headers["X-AgentOne-Chat-Id"] = metadata.chatId;
  if (metadata.trigger) headers["X-AgentOne-Trigger"] = metadata.trigger;
  if (metadata.parentTurnId) {
    headers["X-AgentOne-Parent-Turn-Id"] = metadata.parentTurnId;
  }

  return headers;
}
