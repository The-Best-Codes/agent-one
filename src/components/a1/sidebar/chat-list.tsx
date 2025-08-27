import { Button } from "@/components/ui/button";
import { useModel } from "@/contexts/use-model/model-hooks";
import { listChatIds, loadChatData, saveChatTitle } from "@/lib/ai/persistence";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChatItem } from "./chat-item";

const logger = getLogger(import.meta.url);

interface ChatListItem {
  id: string;
  title: string;
}

const getChatTitle = (title: string): string => {
  return title;
};

export const ChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  const currentModelRef = useRef(currentModel.model);
  currentModelRef.current = currentModel.model;

  const virtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32 + 2, // 32px tall, 2px gap
  });

  const generateTitleForChat = useCallback(async (chatId: string) => {
    try {
      const chatData = loadChatData(chatId);

      if (chatData.title !== "New chat" || chatData.messages.length === 0) {
        return;
      }

      const hasUserMessage = chatData.messages.some((m) => m.role === "user");

      if (!hasUserMessage) {
        return;
      }

      const generatedTitle = await generateChatTitle(
        currentModelRef.current,
        chatData.messages,
      );

      saveChatTitle({ chatId, title: generatedTitle });
    } catch (error) {
      logger.error("Failed to generate title for chat:", chatId, error);
    }
  }, []);

  const refreshChats = useCallback(() => {
    const ids = listChatIds();
    const chatListItems = ids.map((id) => {
      const chatData = loadChatData(id);
      return {
        id,
        title: getChatTitle(chatData.title),
      };
    });
    setChats(chatListItems);
  }, []);

  const eventHandlers = useMemo(() => {
    const handleChatCreated = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      const chatData = loadChatData(chatId);
      setChats((prev) => [
        {
          id: chatId,
          title: getChatTitle(chatData.title),
        },
        ...prev,
      ]);
    };

    const handleChatUpdated = (event: Event) => {
      const { chatId, chatData } = (event as CustomEvent).detail;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: getChatTitle(chatData?.title || "New chat"),
              }
            : chat,
        ),
      );

      if (chatData?.messages && chatData.title === "New chat") {
        generateTitleForChat(chatId);
      }
    };

    const handleChatTitleUpdated = (event: Event) => {
      const { chatId, title } = (event as CustomEvent).detail;
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
      );
    };

    const handleChatDeleted = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    };

    return {
      handleChatCreated,
      handleChatUpdated,
      handleChatTitleUpdated,
      handleChatDeleted,
    };
  }, [generateTitleForChat]);

  useEffect(() => {
    refreshChats();

    const {
      handleChatCreated,
      handleChatUpdated,
      handleChatTitleUpdated,
      handleChatDeleted,
    } = eventHandlers;

    window.addEventListener("persistence:chat-created", handleChatCreated);
    window.addEventListener("persistence:chat-updated", handleChatUpdated);
    window.addEventListener("persistence:chat-deleted", handleChatDeleted);
    window.addEventListener(
      "persistence:chat-title-updated",
      handleChatTitleUpdated,
    );

    return () => {
      window.removeEventListener("persistence:chat-created", handleChatCreated);
      window.removeEventListener("persistence:chat-updated", handleChatUpdated);
      window.removeEventListener("persistence:chat-deleted", handleChatDeleted);
      window.removeEventListener(
        "persistence:chat-title-updated",
        handleChatTitleUpdated,
      );
    };
  }, [refreshChats, eventHandlers]);

  const handleNewChat = () => {
    navigate("/chat");
  };

  useEffect(() => {
    if (chats.length > 0 && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [chats.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const chat = chats[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ChatItem id={chat.id} title={chat.title} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
