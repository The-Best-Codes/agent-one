import {
  CheckSquare2Icon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SplitIcon,
  TrashIcon,
} from "lucide-react";
import { memo, useState } from "react";
import { Link } from "react-router";

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
import { cn } from "@/lib/utils";

import { ChatStatusIndicator } from "./chat-status-indicator";
import { ChangeTitleModal, DeleteChatModal, ExportChatModal } from "./modals";

const logger = getLogger(import.meta.url);

interface ChatItemProps {
  activeChatId?: string;
  additionalOnChatClickCallback?: (id: string) => void;
  id: string;
  title: string;
  branchOf?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: (id: string) => void;
  onEnterSelectionMode?: (id: string) => void;
}

export const ChatItem = memo(
  ({
    activeChatId,
    additionalOnChatClickCallback,
    id,
    title,
    branchOf,
    selectionMode,
    isSelected,
    onSelectionToggle,
    onEnterSelectionMode,
  }: ChatItemProps) => {
    const [showChangeTitleModal, setShowChangeTitleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isSelectedChat = activeChatId === id;

    if (selectionMode) {
      return (
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start py-2 pr-1 pl-2 transition-none",
            isSelected && "border pl-1.75",
          )}
          onClick={() => onSelectionToggle?.(id)}
        >
          <Checkbox checked={isSelected} className="pointer-events-none" />
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
            {branchOf && <SplitIcon className="text-foreground size-3" />}
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
                "group/chat-item w-full justify-between py-2 pr-1 pl-2 transition-none",
                isSelectedChat && "border pl-1.75",
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
              onClick={() => additionalOnChatClickCallback && additionalOnChatClickCallback(id)}
            >
              <Link to={`/chat/${id}`} className="relative block overflow-hidden">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
                  <ChatStatusIndicator chatId={id} />
                  {branchOf && <SplitIcon className="text-foreground size-3" />}
                  <span className="min-w-0 truncate">{title}</span>
                </span>
                <div
                  className={cn(
                    "absolute right-0 flex size-8 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/chat-item:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100",
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
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-auto min-w-max">
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
                        <PencilIcon className="size-4" />
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
                        <DownloadIcon className="size-4" />
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
                        <TrashIcon className="size-4" />
                        Delete Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEnterSelectionMode?.(id);
                        }}
                      >
                        <CheckSquare2Icon className="size-4" />
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
                logger.verbose("Opening change title modal", {
                  chatId: id,
                  title,
                });
                setShowChangeTitleModal(true);
              }}
            >
              <PencilIcon className="size-4" />
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
              <DownloadIcon className="size-4" />
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
              <TrashIcon className="size-4" />
              Delete Chat
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                onEnterSelectionMode?.(id);
              }}
            >
              <CheckSquare2Icon className="size-4" />
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
      </>
    );
  },
);

ChatItem.displayName = "ChatItem";
