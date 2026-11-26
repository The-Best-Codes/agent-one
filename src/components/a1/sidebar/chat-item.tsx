import {
  IconArrowsSplit,
  IconCheckbox,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconClockPlay,
  IconCheck,
  IconFolder,
  IconFolderOff,
  IconFolderShare,
  IconTrash,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { memo, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { MarqueeText } from "@/components/a1/marquee-text";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChatSyncInfo } from "@/hooks/use-chat-sync-info";
import { chatSyncAvailableAtom, chatSyncExcludedIdsAtom } from "@/lib/jotai/sync-atoms";
import { getLogger } from "@/lib/logger";
import { projectsAtom } from "@/lib/projects";
import { CHAT_SYNC_STATE_LABELS, getChatSyncDetails } from "@/lib/sync/chat-sync-display";
import { chatSyncManager } from "@/lib/sync/chat-sync-manager";
import { cn } from "@/lib/utils";

import { ChatStatusIndicator } from "./chat-status-indicator";
import { ChangeTitleModal, DeleteChatModal, ExportChatModal } from "./modals";

const logger = getLogger(import.meta.url);
const MARK_OPEN = "<mark>";
const MARK_CLOSE = "</mark>";

function renderSnippet(snippet: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = snippet;
  let partIndex = 0;

  while (remaining) {
    const markStart = remaining.indexOf(MARK_OPEN);

    if (markStart === -1) {
      parts.push(<span key={`text-${partIndex}`}>{remaining}</span>);
      break;
    }

    if (markStart > 0) {
      parts.push(<span key={`text-${partIndex}`}>{remaining.slice(0, markStart)}</span>);
      partIndex += 1;
    }

    remaining = remaining.slice(markStart + MARK_OPEN.length);
    const markEnd = remaining.indexOf(MARK_CLOSE);

    if (markEnd === -1) {
      parts.push(<span key={`text-${partIndex}`}>{`${MARK_OPEN}${remaining}`}</span>);
      break;
    }

    parts.push(<mark key={`mark-${partIndex}`}>{remaining.slice(0, markEnd)}</mark>);
    partIndex += 1;
    remaining = remaining.slice(markEnd + MARK_CLOSE.length);
  }

  return parts;
}

function BranchIcon({
  branchOf,
  branchParentTitle,
}: {
  branchOf: string;
  branchParentTitle?: string;
}) {
  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span
          className="inline-flex shrink-0"
          data-icon="inline-start"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <IconArrowsSplit className="text-foreground" data-icon="inline-start" />
        </span>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent side="top" onClick={(e) => e.stopPropagation()}>
        <span className="text-background">
          Branched from{" "}
          {branchParentTitle ? (
            <Link
              to={`/chat/${branchOf}`}
              className="font-medium underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {branchParentTitle}
            </Link>
          ) : (
            "another chat"
          )}
        </span>
      </AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}

function ScheduledAgentIcon({ title }: { title: string }) {
  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span
          className="inline-flex shrink-0"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <IconClockPlay className="text-foreground" />
        </span>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent side="top">Scheduled via "{title}"</AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}

interface ChatItemProps {
  activeChatId?: string;
  additionalOnChatClickCallback?: (id: string) => void;
  id: string;
  title: string;
  branchOf?: string;
  branchParentTitle?: string;
  scheduledAgentTitle?: string;
  projectId?: string;
  showProject?: boolean;
  snippet?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: (id: string) => void;
  onEnterSelectionMode?: (ids: string[]) => void;
}

export const ChatItem = memo(
  ({
    activeChatId,
    additionalOnChatClickCallback,
    id,
    title,
    branchOf,
    branchParentTitle,
    scheduledAgentTitle,
    projectId,
    showProject,
    snippet,
    selectionMode,
    isSelected,
    onSelectionToggle,
    onEnterSelectionMode,
  }: ChatItemProps) => {
    const [showChangeTitleModal, setShowChangeTitleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const projects = useAtomValue(projectsAtom);
    const { setChatsProject } = usePersistence();
    const chatSyncAvailable = useAtomValue(chatSyncAvailableAtom);
    const syncExcluded = useAtomValue(chatSyncExcludedIdsAtom).has(id);
    const syncInfo = useChatSyncInfo(
      id,
      chatSyncAvailable && (isDropdownOpen || isContextMenuOpen),
    );
    const syncState = projectId
      ? "project"
      : syncExcluded
        ? "excluded"
        : (syncInfo?.state ?? "pending");
    const SyncStateIcon = CHAT_SYNC_STATE_LABELS[syncState].icon;
    const syncDetails =
      syncInfo || projectId
        ? getChatSyncDetails({
            firstDevice: null,
            lastDevice: null,
            lastSyncedAt: null,
            ...syncInfo,
            state: syncState,
          })
        : [];

    const isSelectedChat = activeChatId === id;
    const projectName = showProject
      ? projects.find((project) => project.id === projectId)?.name
      : undefined;
    const hasSubtitle = Boolean(snippet || projectName);
    const moveToProject = (targetProjectId: string | undefined) => {
      logger.verbose("Moving chat to project", { chatId: id, projectId: targetProjectId });
      setChatsProject([id], targetProjectId);
    };
    const setSyncEnabled = (enabled: boolean) => {
      logger.verbose("Changing chat sync preference", { chatId: id, sync: enabled });
      void chatSyncManager.setChatExcluded(id, !enabled).catch((error) => {
        logger.error("Failed to change chat sync preference", error);
      });
    };

    if (selectionMode) {
      return (
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start py-2 pr-1 pl-2 mb-0.5 transition-none focus-visible:ring-inset",
            isSelected && "border border-border",
          )}
          data-marquee-trigger
          onClick={() => onSelectionToggle?.(id)}
        >
          <Checkbox checked={isSelected} className="pointer-events-none" />
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
            {branchOf && <BranchIcon branchOf={branchOf} branchParentTitle={branchParentTitle} />}
            {scheduledAgentTitle && <ScheduledAgentIcon title={scheduledAgentTitle} />}
            <MarqueeText>{title}</MarqueeText>
          </span>
        </Button>
      );
    }

    return (
      <>
        <ContextMenu onOpenChange={setIsContextMenuOpen}>
          <ContextMenuTrigger asChild>
            <Button
              variant={isSelectedChat ? "secondary" : "ghost"}
              className={cn(
                "group/chat-item w-full justify-between pr-1 pl-2 transition-none focus-visible:ring-inset",
                hasSubtitle ? "h-auto items-start py-1" : "py-2",
                isSelectedChat && "border border-border",
              )}
              asChild
              draggable={true}
              data-marquee-trigger
              aria-selected={isSelectedChat}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "application/agent-one-chat",
                  JSON.stringify({ chatId: id, title }),
                );
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={(e) => {
                if (e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  const ids = activeChatId && activeChatId !== id ? [activeChatId, id] : [id];
                  onEnterSelectionMode?.(ids);
                  return;
                }
                if (isSelectedChat) {
                  additionalOnChatClickCallback?.(id);
                  return;
                }
                additionalOnChatClickCallback?.(id);
              }}
            >
              <Link
                to={`/chat/${id}`}
                className="relative overflow-hidden"
                data-icon="inline-start"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
                    <ChatStatusIndicator chatId={id} />
                    {branchOf && (
                      <BranchIcon branchOf={branchOf} branchParentTitle={branchParentTitle} />
                    )}
                    {scheduledAgentTitle && <ScheduledAgentIcon title={scheduledAgentTitle} />}
                    <MarqueeText contentClassName="pe-7">{title}</MarqueeText>
                  </span>
                  {projectName && (
                    <span className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-xs font-normal">
                      <IconFolder className="size-3 shrink-0" />
                      <span className="truncate">{projectName}</span>
                    </span>
                  )}
                  {snippet && (
                    <span className="text-muted-foreground [&_mark]:text-foreground mt-0.5 truncate text-xs italic [&_mark]:bg-yellow-500/30">
                      {renderSnippet(snippet)}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 right-0 flex size-8 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200 will-change-[opacity] group-hover/chat-item:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
                    isDropdownOpen ? "opacity-100" : "",
                  )}
                >
                  <DropdownMenu onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-6"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <IconDotsVertical data-icon="inline-start" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto min-w-max">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onSelect={() => {
                            logger.verbose("Opening change title modal", {
                              chatId: id,
                              title,
                            });
                            setShowChangeTitleModal(true);
                          }}
                        >
                          <IconEdit />
                          Change Title
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onSelect={() => {
                            logger.verbose("Opening export chat modal", {
                              chatId: id,
                              title,
                            });
                            setShowExportModal(true);
                          }}
                        >
                          <IconDownload />
                          Export Chat
                        </DropdownMenuItem>
                        {(projects.length > 0 || projectId) && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                              <IconFolderShare />
                              Move to Project
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {projects.map((project) => (
                                <DropdownMenuItem
                                  key={project.id}
                                  onClick={(e) => e.stopPropagation()}
                                  onSelect={() => moveToProject(project.id)}
                                  disabled={project.id === projectId}
                                >
                                  {project.id === projectId ? <IconCheck /> : <IconFolder />}
                                  <span className="max-w-60 truncate">{project.name}</span>
                                </DropdownMenuItem>
                              ))}
                              {projectId && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => e.stopPropagation()}
                                    onSelect={() => moveToProject(undefined)}
                                  >
                                    <IconFolderOff />
                                    Remove from Project
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {chatSyncAvailable && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                              <SyncStateIcon />
                              {CHAT_SYNC_STATE_LABELS[syncState].label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="max-w-80">
                              {syncDetails.length > 0 && (
                                <>
                                  <DropdownMenuGroup>
                                    {syncDetails.map((line) => (
                                      <DropdownMenuLabel key={line} className="wrap-break-word">
                                        {line}
                                      </DropdownMenuLabel>
                                    ))}
                                  </DropdownMenuGroup>
                                  {!projectId && <DropdownMenuSeparator />}
                                </>
                              )}
                              {!projectId && (
                                <DropdownMenuGroup>
                                  <DropdownMenuCheckboxItem
                                    checked={!syncExcluded}
                                    onCheckedChange={setSyncEnabled}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Sync This Chat
                                  </DropdownMenuCheckboxItem>
                                </DropdownMenuGroup>
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onSelect={() => {
                            logger.verbose("Opening delete chat modal", {
                              chatId: id,
                              title,
                            });
                            setShowDeleteModal(true);
                          }}
                          variant="destructive"
                        >
                          <IconTrash />
                          Delete Chat
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onSelect={() => {
                            onEnterSelectionMode?.([id]);
                          }}
                        >
                          <IconCheckbox />
                          Select Chat
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  logger.verbose("Opening change title modal", {
                    chatId: id,
                    title,
                  });
                  setShowChangeTitleModal(true);
                }}
              >
                <IconEdit />
                Change Title
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  logger.verbose("Opening export chat modal", {
                    chatId: id,
                    title,
                  });
                  setShowExportModal(true);
                }}
              >
                <IconDownload />
                Export Chat
              </ContextMenuItem>
              {(projects.length > 0 || projectId) && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <IconFolderShare />
                    Move to Project
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {projects.map((project) => (
                      <ContextMenuItem
                        key={project.id}
                        onClick={() => moveToProject(project.id)}
                        disabled={project.id === projectId}
                      >
                        {project.id === projectId ? <IconCheck /> : <IconFolder />}
                        <span className="max-w-60 truncate">{project.name}</span>
                      </ContextMenuItem>
                    ))}
                    {projectId && (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => moveToProject(undefined)}>
                          <IconFolderOff />
                          Remove from Project
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
              {chatSyncAvailable && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <SyncStateIcon />
                    {CHAT_SYNC_STATE_LABELS[syncState].label}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="max-w-80">
                    {syncDetails.length > 0 && (
                      <>
                        <ContextMenuGroup>
                          {syncDetails.map((line) => (
                            <ContextMenuLabel key={line} className="wrap-break-word">
                              {line}
                            </ContextMenuLabel>
                          ))}
                        </ContextMenuGroup>
                        {!projectId && <ContextMenuSeparator />}
                      </>
                    )}
                    {!projectId && (
                      <ContextMenuGroup>
                        <ContextMenuCheckboxItem
                          checked={!syncExcluded}
                          onCheckedChange={setSyncEnabled}
                        >
                          Sync This Chat
                        </ContextMenuCheckboxItem>
                      </ContextMenuGroup>
                    )}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
              <ContextMenuItem
                variant="destructive"
                onClick={() => {
                  logger.verbose("Opening delete chat modal", {
                    chatId: id,
                    title,
                  });
                  setShowDeleteModal(true);
                }}
              >
                <IconTrash />
                Delete Chat
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  onEnterSelectionMode?.([id]);
                }}
              >
                <IconCheckbox />
                Select Chat
              </ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>

        <ChangeTitleModal
          isOpen={showChangeTitleModal}
          onClose={() => setShowChangeTitleModal(false)}
          chatId={id}
          currentTitle={title}
        />

        <DeleteChatModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          chatId={id}
          chatTitle={title}
        />

        <ExportChatModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          chatId={id}
          chatTitle={title}
        />
      </>
    );
  },
);

ChatItem.displayName = "ChatItem";
