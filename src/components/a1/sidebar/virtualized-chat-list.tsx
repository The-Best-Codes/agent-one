import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listChatIds, loadChatData } from "@/lib/ai/persistence";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { InboxIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatItem } from "./chat-item";

const logger = getLogger(import.meta.url);

interface ChatListItem {
  id: string;
  title: string;
}

const getChatTitle = (title: string): string => {
  return title;
};

interface VirtualizedChatListProps {
  activeChatId?: string;
  handleNewChat?: () => void;
  showNewChatButton?: boolean;
  className?: string;
  additionalOnChatClickCallback?: (id: string) => void;
}

export const VirtualizedChatList = ({
  activeChatId,
  handleNewChat,
  showNewChatButton = true,
  className = "w-full",
  additionalOnChatClickCallback,
}: VirtualizedChatListProps) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(() => {
    try {
      const chatIds = listChatIds();
      const loadedChats = chatIds.map((id) => {
        try {
          const chatData = loadChatData(id);
          return {
            id,
            title: getChatTitle(chatData?.title || `Chat ${id.slice(0, 8)}`),
          };
        } catch (error) {
          logger.error(`Error loading chat ${id}:`, error);
          return {
            id,
            title: `Chat ${id.slice(0, 8)}`,
          };
        }
      });

      setChats(loadedChats);
    } catch (error) {
      logger.error("Error loading chats:", error);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chats, searchQuery]);

  const virtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32 + 2, // 32px height + 2px padding
    overscan: 5,
  });

  useEffect(() => {
    const checkOverflow = () => {
      if (parentRef.current) {
        const isOverflowingNow =
          parentRef.current.scrollHeight > parentRef.current.clientHeight;
        setIsOverflowing(isOverflowingNow);
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
  }, [filteredChats]);

  // Event handlers for persistence events
  useEffect(() => {
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

    window.addEventListener("persistence:chat-created", handleChatCreated);
    window.addEventListener("persistence:chat-deleted", handleChatDeleted);
    window.addEventListener(
      "persistence:chat-title-updated",
      handleChatTitleUpdated,
    );

    return () => {
      window.removeEventListener("persistence:chat-created", handleChatCreated);
      window.removeEventListener("persistence:chat-deleted", handleChatDeleted);
      window.removeEventListener(
        "persistence:chat-title-updated",
        handleChatTitleUpdated,
      );
    };
  }, []);

  useEffect(() => {
    if (activeChatId && !chats.find((chat) => chat.id === activeChatId)) {
      loadChats();
    }
  }, [activeChatId, chats, loadChats]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {showNewChatButton && (
        <div className="space-y-2 pb-2">
          <Button
            onClick={() => handleNewChat && handleNewChat()}
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
      )}

      {!showNewChatButton && (
        <div className="pb-2">
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
      )}

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
                    additionalOnChatClickCallback={
                      additionalOnChatClickCallback
                    }
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
