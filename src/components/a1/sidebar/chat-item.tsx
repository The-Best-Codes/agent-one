import {
  IconAppWindow,
  IconArrowsSplit,
  IconCheckbox,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { invoke } from "@tauri-apps/api/core";
import { memo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";

import { ChatAlreadyOpenDialog } from "@/components/a1/chat-already-open-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLogger } from "@/lib/logger";
import { openNewWindow } from "@/lib/tauri/open-new-window";
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

interface ChatItemProps {
  activeChatId?: string;
  additionalOnChatClickCallback?: (id: string) => void;
  id: string;
  title: string;
  branchOf?: string;
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
    const [pendingOtherWindowCount, setPendingOtherWindowCount] = useState<number | null>(null);
    const navigate = useNavigate();

    const isSelectedChat = activeChatId === id;

    const navigateToChat = () => {
      additionalOnChatClickCallback?.(id);
      void navigate(`/chat/${id}`);
    };

    const handleNavigationRequest = async () => {
      try {
        const otherWindowCount = await invoke<number>("check_chat_open_elsewhere", {
          chatId: id,
        });
        if (otherWindowCount > 0) {
          setPendingOtherWindowCount(otherWindowCount);
          return;
        }
        navigateToChat();
      } catch (error) {
        logger.error("Failed to check if chat is open in another window", {
          chatId: id,
          error,
        });
        navigateToChat();
      }
    };

    const handleConfirmOpenAnyway = async () => {
      setPendingOtherWindowCount(null);
      try {
        await invoke("sync_current_window_chat", {
          chatId: id,
          ownerToken: crypto.randomUUID(),
          force: true,
        });
      } catch (error) {
        logger.error("Failed to force-claim chat for current window", {
          chatId: id,
          error,
        });
      }
      navigateToChat();
    };

    if (selectionMode) {
      return (
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start py-2 pr-1 pl-2 mb-0.5 transition-none",
            isSelected && "border border-border",
          )}
          onClick={() => onSelectionToggle?.(id)}
        >
          <Checkbox checked={isSelected} className="pointer-events-none" />
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
            {branchOf && <IconArrowsSplit className="text-foreground" data-icon="inline-start" />}
            <span className="min-w-0 truncate">{title}</span>
          </span>
        </Button>
      );
    }

    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button
              variant={isSelectedChat ? "secondary" : "ghost"}
              className={cn(
                "group/chat-item w-full justify-between pr-1 pl-2 transition-none",
                snippet ? "h-auto items-start py-1" : "py-2",
                isSelectedChat && "border border-border",
              )}
              asChild
              draggable={true}
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
                e.preventDefault();
                void handleNavigationRequest();
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
                      <IconArrowsSplit className="text-foreground" data-icon="inline-start" />
                    )}
                    <span className="min-w-0 truncate">{title}</span>
                  </span>
                  {snippet && (
                    <span className="text-muted-foreground [&_mark]:text-foreground mt-0.5 truncate text-xs [&_mark]:bg-yellow-500/30">
                      {renderSnippet(snippet)}
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 right-0 flex size-8 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/chat-item:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          logger.verbose("Opening chat in new window", {
                            chatId: id,
                            title,
                          });
                          openNewWindow(`/chat/${id}`);
                        }}
                      >
                        <IconAppWindow />
                        Open in New Window
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
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
                          e.preventDefault();
                          e.stopPropagation();
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEnterSelectionMode?.([id]);
                        }}
                      >
                        <IconCheckbox />
                        Select Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                logger.verbose("Opening chat in new window", {
                  chatId: id,
                  title,
                });
                openNewWindow(`/chat/${id}`);
              }}
            >
              <IconAppWindow />
              Open in New Window
            </ContextMenuItem>
            <ContextMenuSeparator />
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
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                onEnterSelectionMode?.([id]);
              }}
            >
              <IconCheckbox />
              Select Chat
            </ContextMenuItem>
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

        <ChatAlreadyOpenDialog
          isOpen={pendingOtherWindowCount !== null}
          otherWindowCount={pendingOtherWindowCount ?? 0}
          onConfirm={() => {
            void handleConfirmOpenAnyway();
          }}
          onCancel={() => setPendingOtherWindowCount(null)}
        />
      </>
    );
  },
);

ChatItem.displayName = "ChatItem";
