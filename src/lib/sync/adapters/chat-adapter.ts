import type { UIMessage } from "ai";

import type { PersistenceContextType } from "@/contexts/use-persistence/persistence-context";

import type { SyncAdapterConfig } from "../core/types";
import { createAdapter } from "./create-adapter";

export interface ChatSyncPayload {
  chatId: string;
  messages: UIMessage[];
  title: string;
}

export function createChatAdapter(): ReturnType<
  typeof createAdapter<ChatSyncPayload, PersistenceContextType>
> {
  const config: SyncAdapterConfig<ChatSyncPayload, PersistenceContextType> = {
    entityType: "chat",
    selector: () => {
      return {
        chatId: "",
        messages: [],
        title: "",
      };
    },
    onRemoteChange: async (payload, persistenceContext) => {
      if (payload.chatId) {
        persistenceContext.saveChat({
          chatId: payload.chatId,
          messages: payload.messages,
        });
        if (payload.title) {
          persistenceContext.saveChatTitle({
            chatId: payload.chatId,
            title: payload.title,
          });
        }
      }
    },
    conflictResolution: (incoming, local) => {
      if (!incoming.messages || !local.messages) {
        return incoming;
      }

      if (incoming.messages.length > local.messages.length) {
        return incoming;
      }

      return local;
    },
  };

  return createAdapter(config);
}
