import {
  IconAppWindow,
  IconChevronDown,
  IconDeselect,
  IconDownload,
  IconInbox,
  IconPlus,
  IconSearch,
  IconSelectAll,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useOverflow } from "@/hooks/use-overflow";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { chatSortAtom } from "@/lib/jotai/settings-atoms";
import { kbdRegistry } from "@/lib/kbd-registry";
import { getLogger } from "@/lib/logger";
import type { ChatSearchResult } from "@/lib/storage/chat-storage";
import { openNewWindow } from "@/lib/tauri/open-new-window";
import { cn } from "@/lib/utils";

import { ChatItem } from "./chat-item";
import { BulkDeleteModal, BulkExportModal } from "./modals";

const logger = getLogger(import.meta.url);

interface ChatListItem {
  id: string;
  title: string;
  branchOf?: string;
  snippet?: string;
  createdAt?: number;
  updatedAt?: number;
}

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
  const [searchResults, setSearchResults] = useState<ChatSearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // TODO: Use an atom to persist search content and raw operators settings?
  const [searchContent, setSearchContent] = useState(true);
  const [rawOperators, setRawOperators] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkExportModal, setShowBulkExportModal] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const latestSearchQueryRef = useRef("");
  const [chatIds] = useAtom(chatIdsAtom);
  const [chatSort] = useAtom(chatSortAtom);

  useHotkeys(kbdRegistry.focusChatSearch, () => {
    searchInputRef.current?.focus();
  });
  const [chatUpdateTrigger] = useAtom(chatUpdateTriggerAtom);
  const { loadChatMetadata, isMetadataLoaded, searchChats } = usePersistence();

  const loadChats = useCallback(() => {
    if (!isMetadataLoaded) return;

    try {
      const loadedChats = chatIds.map((id: string) => {
        try {
          const chatMetadata = loadChatMetadata(id);
          return {
            id,
            title: chatMetadata?.title || `Chat ${id.slice(0, 8)}`,
            branchOf: chatMetadata?.branchOf,
            createdAt: chatMetadata?.createdAt,
            updatedAt: chatMetadata?.updatedAt,
          };
        } catch (error) {
          logger.error(`Error loading chat ${id}:`, error);
          return {
            id,
            title: `Chat ${id.slice(0, 8)}`,
            branchOf: undefined,
            createdAt: undefined,
            updatedAt: undefined,
          };
        }
      });

      loadedChats.sort((a, b) => {
        const left =
          chatSort === "updated-at"
            ? (a.updatedAt ?? a.createdAt ?? 0)
            : (a.createdAt ?? a.updatedAt ?? 0);
        const right =
          chatSort === "updated-at"
            ? (b.updatedAt ?? b.createdAt ?? 0)
            : (b.createdAt ?? b.updatedAt ?? 0);
        if (right !== left) {
          return right - left;
        }
        return b.id.localeCompare(a.id);
      });

      setChats(loadedChats);
    } catch (error) {
      logger.error("Error loading chats:", error);
    }
  }, [chatIds, chatSort, loadChatMetadata, isMetadataLoaded]);

  useEffect(() => {
    loadChats();
  }, [loadChats, chatIds, chatUpdateTrigger]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string, useRawOperators: boolean) => {
        if (!query.trim()) {
          setSearchResults(null);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);
        trackGoogleAnalyticsEvent("chat_search_used", {
          source: "sidebar",
          query_length: query.trim().length,
          search_content: searchContent,
          raw_operators: useRawOperators,
        });
        try {
          const results = await searchChats(query, useRawOperators);
          if (latestSearchQueryRef.current !== query) {
            return;
          }
          setSearchResults(results);
        } catch (error) {
          if (latestSearchQueryRef.current !== query) {
            return;
          }
          logger.error("Search failed:", error);
          setSearchResults(null);
        } finally {
          if (latestSearchQueryRef.current === query) {
            setIsSearching(false);
          }
        }
      }, 300),
    [searchChats, searchContent],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      latestSearchQueryRef.current = value;
      if (!value.trim()) {
        debouncedSearch.cancel();
        setSearchResults(null);
        setIsSearching(false);
      } else if (searchContent) {
        setIsSearching(true);
        void debouncedSearch(value, rawOperators);
      }
    },
    [debouncedSearch, searchContent, rawOperators],
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (searchContent) {
      setIsSearching(true);
      void debouncedSearch(searchQuery, rawOperators);
    } else {
      debouncedSearch.cancel();
      setSearchResults(null);
      setIsSearching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchContent, rawOperators]);

  useEffect(() => {
    setSelectedChatIds((prev) => {
      const validIds = new Set(chatIds);
      const next = new Set(Array.from(prev).filter((id) => validIds.has(id)));
      if (next.size === prev.size) {
        return prev;
      }
      return next;
    });
  }, [chatIds]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    if (!searchContent) {
      return chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (searchResults) {
      const validIds = new Set(chatIds);
      const metadataMap = new Map(chats.map((c) => [c.id, c]));
      return searchResults
        .filter((r) => validIds.has(r.chatId))
        .map((r) => ({
          id: r.chatId,
          title: r.title,
          branchOf: metadataMap.get(r.chatId)?.branchOf,
          snippet: r.snippet,
        }));
    }
    return chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery, searchResults, chatIds, searchContent]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredChats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (filteredChats[index]?.snippet ? 48 : 34),
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  const isOverflowing = useOverflow(parentRef, {
    watch: `${filteredChats.length}:${chats.length}:${isMetadataLoaded}:${searchQuery}`,
  });

  useEffect(() => {
    if (scrollToActiveChat && activeChatId && virtualizer && !searchQuery) {
      const activeIndex = filteredChats.findIndex((chat) => chat.id === activeChatId);
      if (activeIndex !== -1) {
        virtualizer.scrollToIndex(activeIndex, {
          align: "center",
        });
      }
    }
  }, [activeChatId, filteredChats, virtualizer, scrollToActiveChat, searchQuery]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedChatIds.size === filteredChats.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(filteredChats.map((c) => c.id)));
    }
  }, [filteredChats, selectedChatIds.size]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedChatIds(new Set());
  }, []);

  const enterSelectionMode = useCallback((initialIds: string[]) => {
    setSelectionMode(true);
    setSelectedChatIds(new Set(initialIds));
  }, []);

  const showNoChatsPlaceholder = isMetadataLoaded && chats.length === 0;
  const showSearchLoading = isSearching && filteredChats.length === 0 && searchQuery.trim();
  const showNoSearchResults =
    !isSearching && chats.length > 0 && filteredChats.length === 0 && searchQuery.trim();
  const allSelected =
    filteredChats.length > 0 && filteredChats.every((chat) => selectedChatIds.has(chat.id));
  const showList =
    isMetadataLoaded && !showNoChatsPlaceholder && !showSearchLoading && !showNoSearchResults;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className={cn("pb-2", showNewChatButton && "flex flex-col gap-2")}>
        {showNewChatButton && !selectionMode && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleNewChat && handleNewChat()}
              className="flex-1 justify-start"
              variant="outline"
              analytics={{ event: "new_chat_clicked", params: { source: "chat_list" } }}
            >
              <IconPlus data-icon="inline-start" />
              New Chat
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openNewWindow("/chat")}
                  analytics={{ event: "new_window_clicked", params: { source: "chat_list" } }}
                  aria-label="New window"
                >
                  <IconAppWindow />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New window</TooltipContent>
            </Tooltip>
          </div>
        )}
        {selectionMode ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={exitSelectionMode}>
                <IconX />
              </Button>
              <span className="text-muted-foreground text-sm">{selectedChatIds.size} selected</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 justify-start"
                onClick={toggleSelectAll}
                analytics={{ event: "chat_selection_toggled", params: { source: "chat_list" } }}
              >
                {!allSelected ? (
                  <IconSelectAll data-icon="inline-start" />
                ) : (
                  <IconDeselect data-icon="inline-start" />
                )}
                {allSelected ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="size-7"
                disabled={selectedChatIds.size === 0}
                onClick={() => setShowBulkExportModal(true)}
                analytics={{ event: "bulk_chat_export_opened", params: { source: "chat_list" } }}
              >
                <IconDownload data-icon="inline-start" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                className="size-7"
                disabled={selectedChatIds.size === 0}
                onClick={() => setShowBulkDeleteModal(true)}
                analytics={{ event: "bulk_chat_delete_opened", params: { source: "chat_list" } }}
              >
                <IconTrash data-icon="inline-start" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-row">
            <div className="group/sidebar-search-input relative min-w-0 flex-1">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-100 duration-200 group-focus-within/sidebar-search-input:left-0 group-focus-within/sidebar-search-input:opacity-0" />
              <Input
                ref={searchInputRef}
                placeholder={searchContent ? "Search chats..." : "Search titles..."}
                className="bg-background rounded-r-none pl-9 transition-[padding] duration-200 group-focus-within/sidebar-search-input:pl-3"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-l-none border-l-0"
                  aria-label="Search options"
                  analytics={{ event: "chat_search_options_opened", params: { source: "sidebar" } }}
                >
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-max">
                <DropdownMenuLabel>Search mode</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={searchContent}
                  onCheckedChange={(checked) => setSearchContent(checked as boolean)}
                >
                  Search content
                </DropdownMenuCheckboxItem>
                {searchContent && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={rawOperators}
                      onCheckedChange={(checked) => setRawOperators(checked as boolean)}
                    >
                      Raw FTS5 syntax
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div
        ref={parentRef}
        className={cn(
          "flex-1",
          showList ? "overflow-y-auto" : "overflow-hidden",
          isOverflowing && showList && "pr-2",
        )}
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
            <IconInbox className="text-muted-foreground size-16" />
            <p className="max-w-full min-w-0 truncate">No chats yet</p>
          </div>
        ) : showSearchLoading ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm">
            <Spinner className="text-muted-foreground size-16" />
            <p className="max-w-full min-w-0 truncate">Searching...</p>
          </div>
        ) : showNoSearchResults ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center text-sm">
            <IconInbox className="text-muted-foreground size-16" />
            <span className="max-w-full min-w-0 truncate">No results for "{searchQuery}"</span>
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
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ChatItem
                    key={chat.id}
                    activeChatId={activeChatId}
                    id={chat.id}
                    title={chat.title}
                    branchOf={chat.branchOf}
                    snippet={chat.snippet}
                    additionalOnChatClickCallback={additionalOnChatClickCallback}
                    selectionMode={selectionMode}
                    isSelected={selectedChatIds.has(chat.id)}
                    onSelectionToggle={toggleSelection}
                    onEnterSelectionMode={enterSelectionMode}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        chatIds={Array.from(selectedChatIds)}
        chatCount={selectedChatIds.size}
      />
      <BulkExportModal
        isOpen={showBulkExportModal}
        onClose={() => setShowBulkExportModal(false)}
        chatIds={Array.from(selectedChatIds)}
        chatCount={selectedChatIds.size}
      />
    </div>
  );
};
