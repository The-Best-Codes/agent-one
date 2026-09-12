import {
  IconChevronDown,
  IconDeselect,
  IconDownload,
  IconInbox,
  IconPlus,
  IconSelectAll,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useOverflow } from "@/hooks/use-overflow";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { chatSortAtom, sidebarChatTimeGroupingAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import type { ChatSearchResult } from "@/lib/storage/chat-storage";
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

type ChatListRow =
  | { type: "header"; id: string; label: string }
  | { type: "chat"; chat: ChatListItem };

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getChatTimeGroup(
  chat: ChatListItem,
  chatSort: "created-at" | "updated-at",
): { id: string; label: string } {
  const timestamp =
    chatSort === "updated-at"
      ? (chat.updatedAt ?? chat.createdAt)
      : (chat.createdAt ?? chat.updatedAt);

  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) {
    return { id: "older", label: "Older" };
  }

  const age = Math.max(0, Date.now() - timestamp);
  if (age < 7 * DAY_IN_MS) {
    return { id: "recent", label: "Recent" };
  }
  if (age < 14 * DAY_IN_MS) {
    return { id: "last-week", label: "Last Week" };
  }
  if (age < 31 * DAY_IN_MS) {
    return { id: "last-month", label: "Last Month" };
  }

  const date = new Date(timestamp);
  const currentYear = new Date().getFullYear();
  const label = new Intl.DateTimeFormat("en", {
    month: "long",
    ...(date.getFullYear() !== currentYear && { year: "numeric" }),
  }).format(date);
  return { id: `month-${date.getFullYear()}-${date.getMonth()}`, label };
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
  const [groupSearchResults, setGroupSearchResults] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkExportModal, setShowBulkExportModal] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const latestSearchQueryRef = useRef("");
  const [chatIds] = useAtom(chatIdsAtom);
  const [chatSort] = useAtom(chatSortAtom);
  const [sidebarChatTimeGrouping] = useAtom(sidebarChatTimeGroupingAtom);

  useKeyboardShortcut("focusChatSearch", () => {
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
          ui_location: "sidebar",
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
          createdAt: metadataMap.get(r.chatId)?.createdAt,
          updatedAt: metadataMap.get(r.chatId)?.updatedAt,
        }));
    }
    return chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [chats, searchQuery, searchResults, chatIds, searchContent]);

  const listRows = useMemo<ChatListRow[]>(() => {
    const shouldGroup =
      sidebarChatTimeGrouping === "always" ||
      (sidebarChatTimeGrouping === "only-when-searching" &&
        Boolean(searchQuery.trim()) &&
        groupSearchResults);
    if (!shouldGroup) {
      return filteredChats.map((chat) => ({ type: "chat", chat }));
    }

    const groupedChats = [...filteredChats].sort((a, b) => {
      const recencyKey = (chat: ChatListItem) => {
        const groupId = getChatTimeGroup(chat, chatSort).id;
        if (groupId === "recent") return 0;
        if (groupId === "last-week") return 1;
        if (groupId === "last-month") return 2;
        if (groupId.startsWith("month-")) {
          const [, year, month] = groupId.split("-").map(Number);
          return 3 + (new Date().getFullYear() - year) * 12 + new Date().getMonth() - month;
        }
        return Number.MAX_SAFE_INTEGER;
      };
      return recencyKey(a) - recencyKey(b);
    });
    let previousGroupId: string | undefined;
    return groupedChats.flatMap((chat) => {
      const group = getChatTimeGroup(chat, chatSort);
      const rows: ChatListRow[] = [];
      if (group.id !== previousGroupId) {
        rows.push({ type: "header", ...group });
        previousGroupId = group.id;
      }
      rows.push({ type: "chat", chat });
      return rows;
    });
  }, [chatSort, filteredChats, groupSearchResults, searchQuery, sidebarChatTimeGrouping]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: listRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = listRows[index];
      return row?.type === "header" ? 28 : row?.chat.snippet ? 48 : 34;
    },
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  const isOverflowing = useOverflow(parentRef, {
    watch: `${listRows.length}:${chats.length}:${isMetadataLoaded}:${searchQuery}`,
  });

  useEffect(() => {
    if (scrollToActiveChat && activeChatId && virtualizer && !searchQuery) {
      const activeIndex = listRows.findIndex(
        (row) => row.type === "chat" && row.chat.id === activeChatId,
      );
      if (activeIndex !== -1) {
        virtualizer.scrollToIndex(activeIndex, {
          align: "center",
        });
      }
    }
  }, [activeChatId, listRows, virtualizer, scrollToActiveChat, searchQuery]);

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
          <Button
            onClick={() => handleNewChat && handleNewChat()}
            className="w-full justify-start"
            variant="outline"
            analytics={{ event: "new_chat_clicked", params: { ui_location: "chat_list" } }}
          >
            <IconPlus data-icon="inline-start" />
            New Chat
          </Button>
        )}
        {selectionMode ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={exitSelectionMode}>
                <IconX />
              </Button>
              <span className="text-muted-foreground text-sm">
                {`${selectedChatIds.size} selected`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 justify-start"
                onClick={toggleSelectAll}
                analytics={{
                  event: "chat_selection_toggled",
                  params: { ui_location: "chat_list" },
                }}
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
                analytics={{
                  event: "bulk_chat_export_opened",
                  params: { ui_location: "chat_list" },
                }}
              >
                <IconDownload data-icon="inline-start" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                className="size-7"
                disabled={selectedChatIds.size === 0}
                onClick={() => setShowBulkDeleteModal(true)}
                analytics={{
                  event: "bulk_chat_delete_opened",
                  params: { ui_location: "chat_list" },
                }}
              >
                <IconTrash data-icon="inline-start" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-row">
            <SearchInput
              ref={searchInputRef}
              containerClassName="min-w-0 flex-1"
              className="rounded-r-none"
              placeholder={searchContent ? "Search chats..." : "Search titles..."}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-l-none border-l-0"
                  aria-label="Search options"
                  analytics={{
                    event: "chat_search_options_opened",
                    params: { ui_location: "sidebar" },
                  }}
                >
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-auto min-w-max">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Search mode</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={searchContent}
                    onCheckedChange={(checked) => setSearchContent(checked as boolean)}
                  >
                    Search content
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={groupSearchResults}
                    onCheckedChange={(checked) => setGroupSearchResults(checked as boolean)}
                  >
                    Group search results by time
                  </DropdownMenuCheckboxItem>
                </DropdownMenuGroup>
                {searchContent && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuCheckboxItem
                        checked={rawOperators}
                        onCheckedChange={(checked) => setRawOperators(checked as boolean)}
                      >
                        Allow search operators
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuGroup>
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
          showList ? "overflow-y-auto scroll-fade" : "overflow-hidden",
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
            <span className="max-w-full min-w-0 truncate">{`No results for "${searchQuery}"`}</span>
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
              const row = listRows[virtualItem.index];
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
                  {row.type === "header" ? (
                    <div className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">
                      {row.label}
                    </div>
                  ) : (
                    <ChatItem
                      activeChatId={activeChatId}
                      id={row.chat.id}
                      title={row.chat.title}
                      branchOf={row.chat.branchOf}
                      snippet={row.chat.snippet}
                      additionalOnChatClickCallback={additionalOnChatClickCallback}
                      selectionMode={selectionMode}
                      isSelected={selectedChatIds.has(row.chat.id)}
                      onSelectionToggle={toggleSelection}
                      onEnterSelectionMode={enterSelectionMode}
                    />
                  )}
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
