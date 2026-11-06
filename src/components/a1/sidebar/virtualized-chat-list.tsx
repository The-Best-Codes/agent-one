import {
  IconChevronDown,
  IconDeselect,
  IconDownload,
  IconFolderPlus,
  IconInbox,
  IconPlus,
  IconSelectAll,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom, useAtomValue, useAtomValueRawSync } from "jotai";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
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
import { listScheduledAgents, SCHEDULED_AGENTS_CHANGED_EVENT } from "@/lib/cron";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { collapsedProjectIdsAtom } from "@/lib/jotai/unsynced-local-atoms";
import { getLogger } from "@/lib/logger";
import { type Project, projectsAtom } from "@/lib/projects";
import type { SettingValue } from "@/lib/settings/definitions";
import type { ChatSearchResult } from "@/lib/storage/chat-storage";
import { cn } from "@/lib/utils";

import { ChatItem } from "./chat-item";
import { BulkDeleteModal, BulkExportModal, ProjectModal } from "./modals";
import { ProjectItem } from "./project-item";

const logger = getLogger(import.meta.url);

interface ChatListItem {
  id: string;
  title: string;
  branchOf?: string;
  scheduledAgentId?: string;
  scheduledAgentTitle?: string;
  projectId?: string;
  snippet?: string;
  createdAt?: number;
  updatedAt?: number;
  lastMessageAt?: number;
}

type ChatListRow =
  | { type: "header"; id: string; label: string; afterProjects?: boolean }
  | { type: "project"; project: Project; collapsed: boolean }
  | { type: "show-more"; projectId: string; hiddenCount: number; expanded: boolean }
  | { type: "empty-project"; projectId: string }
  | { type: "chat"; chat: ChatListItem; nested?: boolean; showProject?: boolean };

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PROJECT_CHAT_PREVIEW_COUNT = 5;

function getRowKey(row: ChatListRow): string {
  if (row.type === "header") return `header-${row.id}`;
  if (row.type === "project") return `project-${row.project.id}`;
  if (row.type === "show-more") return `show-more-${row.projectId}`;
  if (row.type === "empty-project") return `empty-project-${row.projectId}`;
  return `chat-${row.chat.id}`;
}

function getRowSize(row: ChatListRow | undefined): number {
  if (!row) return 34;
  if (row.type === "header") return 32;
  if (row.type === "show-more" || row.type === "empty-project") return 28;
  if (row.type === "project") return 34;
  return row.chat.snippet || row.showProject ? 48 : 34;
}

function getChatSortTimestamp(chat: ChatListItem, chatSort: SettingValue<"CHAT_SORT">): number {
  if (chatSort === "updated-at") {
    return chat.lastMessageAt ?? chat.createdAt ?? 0;
  }
  if (chatSort === "active-at") {
    return chat.updatedAt ?? chat.createdAt ?? 0;
  }
  return chat.createdAt ?? chat.updatedAt ?? 0;
}

function getChatTimeGroup(timestamp: number, now: number): { id: string; label: string } {
  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) {
    return { id: "older", label: "Older" };
  }

  const age = Math.max(0, now - timestamp);
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
  const currentYear = new Date(now).getFullYear();
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkExportModal, setShowBulkExportModal] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const latestSearchQueryRef = useRef("");
  const chatIds = useAtomValueRawSync(chatIdsAtom);
  const [chatSort] = useAtom(settingAtoms.CHAT_SORT);
  const [sidebarChatTimeGrouping] = useAtom(settingAtoms.SIDEBAR_CHAT_TIME_GROUPING);

  useKeyboardShortcut("focusChatSearch", () => {
    searchInputRef.current?.focus();
  });
  const [chatUpdateTrigger] = useAtom(chatUpdateTriggerAtom);
  const { loadChatMetadata, isMetadataLoaded, searchChats } = usePersistence();
  const [scheduledAgentTitles, setScheduledAgentTitles] = useState<Record<string, string>>({});
  const projects = useAtomValue(projectsAtom);
  const [collapsedProjectIds, setCollapsedProjectIds] = useAtom(collapsedProjectIdsAtom);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const showProjects = showNewChatButton;

  useEffect(() => {
    const refresh = () => {
      void listScheduledAgents()
        .then((agents) =>
          setScheduledAgentTitles(
            Object.fromEntries(agents.map((agent) => [agent.id, agent.title])),
          ),
        )
        .catch((error) => logger.warn("Failed to load scheduled agent titles", error));
    };
    refresh();
    window.addEventListener(SCHEDULED_AGENTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SCHEDULED_AGENTS_CHANGED_EVENT, refresh);
  }, []);

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
            scheduledAgentId: chatMetadata?.scheduledAgentId,
            scheduledAgentTitle: chatMetadata?.scheduledAgentTitle,
            projectId: chatMetadata?.projectId,
            createdAt: chatMetadata?.createdAt,
            updatedAt: chatMetadata?.updatedAt,
            lastMessageAt: chatMetadata?.lastMessageAt,
          };
        } catch (error) {
          logger.error(`Error loading chat ${id}:`, error);
          return {
            id,
            title: `Chat ${id.slice(0, 8)}`,
            branchOf: undefined,
            scheduledAgentId: undefined,
            scheduledAgentTitle: undefined,
            projectId: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            lastMessageAt: undefined,
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

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string, useRawOperators: boolean) => {
        if (!query.trim()) {
          setSearchResults(null);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);

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
    [searchChats],
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

  const filteredChats = useMemo<ChatListItem[]>(() => {
    const sortedChats = [...chats].sort((a, b) => {
      const left = getChatSortTimestamp(a, chatSort);
      const right = getChatSortTimestamp(b, chatSort);
      return right - left || b.id.localeCompare(a.id);
    });
    if (!searchQuery.trim()) return sortedChats;
    if (!searchContent) {
      return sortedChats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
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
          projectId: metadataMap.get(r.chatId)?.projectId,
          snippet: r.snippet,
          createdAt: metadataMap.get(r.chatId)?.createdAt,
          updatedAt: metadataMap.get(r.chatId)?.updatedAt,
          lastMessageAt: metadataMap.get(r.chatId)?.lastMessageAt,
        }));
    }
    return sortedChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [chats, chatSort, searchQuery, searchResults, chatIds, searchContent]);

  const toggleProject = useCallback(
    (projectId: string) => {
      setCollapsedProjectIds((prev) =>
        prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
      );
    },
    [setCollapsedProjectIds],
  );

  const toggleProjectShowAll = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const listRows = useMemo<ChatListRow[]>(() => {
    const isSearchActive = Boolean(searchQuery.trim());
    const groupByProject = showProjects && !isSearchActive && projects.length > 0;
    const rows: ChatListRow[] = [];
    let otherChats = filteredChats;
    let projectRowCount = 0;

    if (groupByProject) {
      const projectIds = new Set(projects.map((project) => project.id));
      const chatsByProject = new Map<string, ChatListItem[]>();
      otherChats = [];
      for (const chat of filteredChats) {
        if (chat.projectId && projectIds.has(chat.projectId)) {
          const projectChats = chatsByProject.get(chat.projectId) ?? [];
          projectChats.push(chat);
          chatsByProject.set(chat.projectId, projectChats);
        } else {
          otherChats.push(chat);
        }
      }

      for (const project of projects) {
        const projectChats = chatsByProject.get(project.id) ?? [];
        const collapsed = collapsedProjectIds.includes(project.id);
        rows.push({ type: "project", project, collapsed });
        if (collapsed) {
          const activeChat = projectChats.find((chat) => chat.id === activeChatId);
          if (activeChat) rows.push({ type: "chat", chat: activeChat, nested: true });
          continue;
        }
        if (projectChats.length === 0) {
          rows.push({ type: "empty-project", projectId: project.id });
          continue;
        }
        const expanded = expandedProjectIds.has(project.id);
        const visibleChats = expanded
          ? projectChats
          : projectChats.slice(0, PROJECT_CHAT_PREVIEW_COUNT);
        if (!visibleChats.some((chat) => chat.id === activeChatId)) {
          const activeChat = projectChats.find((chat) => chat.id === activeChatId);
          if (activeChat) visibleChats.push(activeChat);
        }
        for (const chat of visibleChats) {
          rows.push({ type: "chat", chat, nested: true });
        }
        if (projectChats.length > PROJECT_CHAT_PREVIEW_COUNT) {
          rows.push({
            type: "show-more",
            projectId: project.id,
            hiddenCount:
              projectChats.length - (expanded ? PROJECT_CHAT_PREVIEW_COUNT : visibleChats.length),
            expanded,
          });
        }
      }

      projectRowCount = rows.length;
      if (!sidebarChatTimeGrouping && otherChats.length > 0) {
        rows.push({ type: "header", id: "chats", label: "Chats", afterProjects: true });
      }
    }

    if (!sidebarChatTimeGrouping || isSearchActive) {
      for (const chat of otherChats) {
        rows.push({ type: "chat", chat, showProject: isSearchActive });
      }
      return rows;
    }

    const now = Date.now();
    let previousGroupId: string | undefined;
    for (const chat of otherChats) {
      const group = getChatTimeGroup(getChatSortTimestamp(chat, chatSort), now);
      if (group.id !== previousGroupId) {
        rows.push({
          type: "header",
          ...group,
          afterProjects: projectRowCount > 0 && rows.length === projectRowCount,
        });
        previousGroupId = group.id;
      }
      rows.push({ type: "chat", chat });
    }
    return rows;
  }, [
    activeChatId,
    chatSort,
    collapsedProjectIds,
    expandedProjectIds,
    filteredChats,
    projects,
    searchQuery,
    showProjects,
    sidebarChatTimeGrouping,
  ]);

  const getItemKey = useCallback((index: number) => getRowKey(listRows[index]), [listRows]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: listRows.length,
    getItemKey,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => getRowSize(listRows[index]),
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  const isOverflowing = useOverflow(parentRef, {
    watch: `${listRows.length}:${chats.length}:${isMetadataLoaded}:${searchQuery}`,
  });

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (scrollToActiveChat && activeChatId && virtualizer && !searchQuery) {
      const activeIndex = listRows.findIndex(
        (row) => row.type === "chat" && row.chat.id === activeChatId,
      );
      if (activeIndex !== -1) {
        const el = parentRef.current;
        const item = virtualizer.getVirtualItems().find((i) => i.index === activeIndex);
        const inView =
          el && item && item.start >= el.scrollTop && item.end <= el.scrollTop + el.clientHeight;
        if (!hasScrolledRef.current || !inView) {
          virtualizer.scrollToIndex(activeIndex, {
            align: "center",
            behavior: hasScrolledRef.current ? "smooth" : "auto",
          });
        }
        hasScrolledRef.current = true;
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

  const showNoChatsPlaceholder =
    isMetadataLoaded && chats.length === 0 && (!showProjects || projects.length === 0);
  const showSearchLoading =
    isSearching &&
    searchContent &&
    (searchResults === null || filteredChats.length === 0) &&
    searchQuery.trim();
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
          <div className="flex gap-2">
            <Button
              onClick={() => handleNewChat && handleNewChat()}
              className="min-w-0 flex-1 justify-start"
              variant="outline"
            >
              <IconPlus data-icon="inline-start" />
              New Chat
            </Button>
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  onClick={() => setShowNewProjectModal(true)}
                  variant="outline"
                  size="icon"
                  aria-label="New project"
                >
                  <IconFolderPlus />
                </Button>
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent>New project</AdaptiveTooltipContent>
            </AdaptiveTooltip>
          </div>
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
              >
                <IconDownload data-icon="inline-start" />
              </Button>
              <Button
                variant="destructive"
                size="icon-sm"
                className="size-7"
                disabled={selectedChatIds.size === 0}
                onClick={() => setShowBulkDeleteModal(true)}
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
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-l-none border-l-0"
                  aria-label="Search options"
                >
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-max">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Search mode</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={searchContent}
                    onCheckedChange={(checked) => setSearchContent(checked as boolean)}
                  >
                    Search content
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
          showList ? "overflow-y-auto" : "overflow-hidden",
          isOverflowing && showList && "scroll-fade pr-2 [--scroll-fade-reveal:--spacing(12)]",
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
                    <div
                      className={cn(
                        "text-muted-foreground px-2 pb-1 text-xs font-medium",
                        virtualItem.index === 0 ? "pt-1" : row.afterProjects ? "pt-2" : "pt-4",
                      )}
                    >
                      {row.label}
                    </div>
                  ) : row.type === "project" ? (
                    <ProjectItem
                      project={row.project}
                      collapsed={row.collapsed}
                      onToggle={toggleProject}
                      selectionMode={selectionMode}
                      onNewChat={
                        additionalOnChatClickCallback
                          ? () => additionalOnChatClickCallback(row.project.id)
                          : undefined
                      }
                    />
                  ) : row.type === "empty-project" ? (
                    <div className="pl-6">
                      <div className="text-muted-foreground flex h-7 items-center pl-2 text-xs">
                        No chats yet
                      </div>
                    </div>
                  ) : row.type === "show-more" ? (
                    <div className="pl-6">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground h-7 w-full rounded-md pl-2 text-left text-xs"
                        onClick={() => toggleProjectShowAll(row.projectId)}
                      >
                        {row.expanded ? "Show less" : `Show ${row.hiddenCount} more`}
                      </button>
                    </div>
                  ) : (
                    <div className={row.nested ? "pl-6" : undefined}>
                      <ChatItem
                        activeChatId={activeChatId}
                        id={row.chat.id}
                        title={row.chat.title}
                        branchOf={row.chat.branchOf}
                        branchParentTitle={
                          row.chat.branchOf
                            ? chats.find((c) => c.id === row.chat.branchOf)?.title
                            : undefined
                        }
                        scheduledAgentTitle={
                          row.chat.scheduledAgentId
                            ? (scheduledAgentTitles[row.chat.scheduledAgentId] ??
                              row.chat.scheduledAgentTitle)
                            : undefined
                        }
                        projectId={row.chat.projectId}
                        showProject={row.showProject}
                        snippet={row.chat.snippet}
                        additionalOnChatClickCallback={additionalOnChatClickCallback}
                        selectionMode={selectionMode}
                        isSelected={selectedChatIds.has(row.chat.id)}
                        onSelectionToggle={toggleSelection}
                        onEnterSelectionMode={enterSelectionMode}
                      />
                    </div>
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

      <ProjectModal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)} />

      <BulkExportModal
        isOpen={showBulkExportModal}
        onClose={() => setShowBulkExportModal(false)}
        chatIds={Array.from(selectedChatIds)}
        chatCount={selectedChatIds.size}
      />
    </div>
  );
};
