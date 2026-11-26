import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { chatSyncStatusAtom } from "@/lib/jotai/sync-atoms";
import { type ChatSyncInfo, chatSyncManager } from "@/lib/sync/chat-sync-manager";

export function useChatSyncInfo(chatId: string, enabled: boolean): ChatSyncInfo | null {
  const [info, setInfo] = useState<ChatSyncInfo | null>(null);
  const status = useAtomValue(chatSyncStatusAtom);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void chatSyncManager.getChatSyncInfo(chatId).then((next) => {
      if (!cancelled) setInfo(next);
    });
    return () => {
      cancelled = true;
    };
  }, [chatId, enabled, status]);

  return info;
}
