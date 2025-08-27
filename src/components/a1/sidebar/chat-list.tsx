import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModel } from "@/contexts/use-model/model-hooks";
import { listChatIds, loadChatData, saveChatTitle } from "@/lib/ai/persistence";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { InboxIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  const parentRef = useRef<HTMLDivElement>(null);

  const currentModelRef = useRef(currentModel.model);
  currentModelRef.current = currentModel.model;

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chats, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32 + 2, // 32px tall, 2px gap
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (parentRef.current) {
        const contentHeight = virtualizer.getTotalSize();
        const containerHeight = parentRef.current.clientHeight;
        setIsOverflowing(contentHeight > containerHeight);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [virtualizer, filteredChats.length]);

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
    try {
      if (virtualizer && activeChatId) {
        const activeChatIndex = chats.findIndex(
          (chat) => chat.id === activeChatId,
        );
        if (activeChatIndex === -1) return;

        const range = virtualizer.range;

        if (range) {
          const { startIndex, endIndex } = range;
          const isAlreadyInViewport =
            activeChatIndex >= startIndex && activeChatIndex <= endIndex;

          if (!isAlreadyInViewport) {
            virtualizer.scrollToIndex(activeChatIndex, {
              align: "center",
              behavior: "auto",
            });
          }
        }
      }
    } catch (error) {
      logger.error("Error scrolling to top:", error);
    }
  }, [activeChatId, chats, virtualizer]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </Button>
        <div className="group/sidebar-search-input relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-100 duration-200 group-focus-within/sidebar-search-input:left-0 group-focus-within/sidebar-search-input:opacity-0" />
          <Input
            placeholder="Search chats..."
            className="pl-9 transition-[padding] duration-200 group-focus-within/sidebar-search-input:pl-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div
        ref={parentRef}
        className={cn("flex-1 overflow-y-auto", isOverflowing && "pr-2")}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {filteredChats.length === 0 && chats.length > 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center text-center text-sm">
              <InboxIcon className="text-muted-foreground size-16" />
              <span className="max-w-full min-w-0 truncate">
                No results for "{searchQuery}"
              </span>
            </div>
          ) : (
            virtualizer.getVirtualItems().map((virtualItem) => {
              const chat = filteredChats[virtualItem.index];
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
                  <ChatItem
                    key={chat.id}
                    activeChatId={activeChatId}
                    id={chat.id}
                    title={chat.title}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
