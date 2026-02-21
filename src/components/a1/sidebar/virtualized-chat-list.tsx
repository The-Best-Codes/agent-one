import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import { InboxIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { kbdRegistry } from "@/lib/kbd-registry";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { ChatItem } from "./chat-item";

const logger = getLogger(import.meta.url);

interface ChatListItem {
  id: string;
  title: string;
  branchOf?: string;
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
  scrollToActiveChat?: boolean;
}

export const VirtualizedChatList = ({
  activeChatId,
  handleNewChat,
  showNewChatButton = true,
  className = "w-full",
  additionalOnChatClickCallback,
  scrollToActiveChat = true,
}: VirtualizedChatListProps) => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [chatIds] = useAtom(chatIdsAtom);

  useHotkeys(kbdRegistry.focusChatSearch, () => {
    searchInputRef.current?.focus();
  });
  const [chatUpdateTrigger] = useAtom(chatUpdateTriggerAtom);
  const { loadChatMetadata, isMetadataLoaded } = usePersistence();

  const loadChats = useCallback(() => {
    if (!isMetadataLoaded) return;

    try {
      const loadedChats = chatIds.map((id: string) => {
        try {
          const chatMetadata = loadChatMetadata(id);
          return {
            id,
            title: getChatTitle(
              chatMetadata?.title || `Chat ${id.slice(0, 8)}`,
            ),
            branchOf: chatMetadata?.branchOf,
          };
        } catch (error) {
          logger.error(`Error loading chat ${id}:`, error);
          return {
            id,
            title: `Chat ${id.slice(0, 8)}`,
            branchOf: undefined,
          };
        }
      });

      setChats(loadedChats);
    } catch (error) {
      logger.error("Error loading chats:", error);
    }
  }, [chatIds, loadChatMetadata, isMetadataLoaded]);

  useEffect(() => {
    loadChats();
  }, [loadChats, chatIds, chatUpdateTrigger]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chats, searchQuery]);

  // eslint-disable-next-line react-hooks/incompatible-library
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

    const timeoutId = setTimeout(checkOverflow, 0);

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [filteredChats.length]);

  useEffect(() => {
    if (scrollToActiveChat && activeChatId && virtualizer && !searchQuery) {
      const activeIndex = filteredChats.findIndex(
        (chat) => chat.id === activeChatId,
      );
      if (activeIndex !== -1) {
        virtualizer.scrollToIndex(activeIndex, {
          align: "center",
        });
      }
    }
  }, [
    activeChatId,
    filteredChats,
    virtualizer,
    scrollToActiveChat,
    searchQuery,
  ]);

  const showNoChatsPlaceholder = isMetadataLoaded && chats.length === 0;
  const showNoSearchResults =
    chats.length > 0 && filteredChats.length === 0 && searchQuery.trim();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className={cn("pb-2", showNewChatButton && "flex flex-col gap-2")}>
        {showNewChatButton && (
          <Button
            onClick={() => handleNewChat && handleNewChat()}
            className="w-full justify-start"
            variant="outline"
          >
            <PlusIcon className="size-4" />
            New Chat
          </Button>
        )}
        <div className="group/sidebar-search-input relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-100 duration-200 group-focus-within/sidebar-search-input:left-0 group-focus-within/sidebar-search-input:opacity-0" />
          <Input
            ref={searchInputRef}
            placeholder="Search chats..."
            className="bg-background pl-9 transition-[padding] duration-200 group-focus-within/sidebar-search-input:pl-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div
        ref={parentRef}
        className={cn("flex-1 overflow-y-auto", isOverflowing && "pr-2")}
      >
        {!isMetadataLoaded ? (
          <div className="flex flex-col gap-1 pt-1">
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        ) : showNoChatsPlaceholder ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm">
            <InboxIcon className="text-muted-foreground size-16" />
            <p className="max-w-full min-w-0 truncate">No chats yet</p>
          </div>
        ) : showNoSearchResults ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm">
            <InboxIcon className="text-muted-foreground size-16" />
            <span className="max-w-full min-w-0 truncate">
              No results for "{searchQuery}"
            </span>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
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
                    branchOf={chat.branchOf}
                    additionalOnChatClickCallback={
                      additionalOnChatClickCallback
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
