import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";
import type { ChatStatusIndicator } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const SENDER_ID = getCurrentWebviewWindow().label;

export type WindowSyncEvent =
  | { type: "chat-created"; chatId: string; metadata: ChatMetadata }
  | { type: "chat-branched"; chatId: string; metadata: ChatMetadata }
  | { type: "chat-deleted"; chatId: string }
  | { type: "chats-bulk-deleted"; chatIds: string[] }
  | { type: "chat-metadata-updated"; chatId: string; metadata: ChatMetadata }
  | { type: "chat-status"; chatId: string; status: ChatStatusIndicator };

interface Envelope {
  sender: string;
  event: WindowSyncEvent;
}

const EVENT_NAME = "a1:window-sync";

export const emitWindowSyncEvent = (event: WindowSyncEvent): void => {
  const envelope: Envelope = { sender: SENDER_ID, event };
  void emit(EVENT_NAME, envelope).catch((error) => {
    logger.warn("Failed to emit window-sync event", { event, error });
  });
};

export const onWindowSyncEvent = (
  handler: (event: WindowSyncEvent) => void,
): Promise<UnlistenFn> => {
  return listen<Envelope>(EVENT_NAME, ({ payload }) => {
    if (payload.sender === SENDER_ID) return;
    handler(payload.event);
  });
};
