import { useAtomValue } from "jotai";
import {
  AlertCircleIcon,
  CircleDotDashedIcon,
  DownloadIcon,
  GitBranch,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { memo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type ChatStatusIndicator,
  chatStatusIndicatorsAtom,
} from "@/lib/jotai/atoms";
import { showChatStatusIndicatorAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { ChangeTitleModal, DeleteChatModal, ExportChatModal } from "./modals";

const logger = getLogger(import.meta.url);

const StatusIndicator = ({ status }: { status: ChatStatusIndicator }) => {
  if (!status) return null;

  switch (status) {
    case "loading":
      return (
        <Loader2Icon className="text-foreground size-4 shrink-0 animate-spin" />
      );
    case "error":
      return <AlertCircleIcon className="text-destructive size-4 shrink-0" />;
    case "unread":
      return (
        <CircleDotDashedIcon className="text-foreground size-4 shrink-0" />
      );
    default:
      return null;
  }
};

interface ChatItemProps {
  activeChatId?: string;
  additionalOnChatClickCallback?: (id: string) => void;
  id: string;
  title: string;
  branchOf?: string;
}

export const ChatItem = memo(
  ({
    activeChatId,
    additionalOnChatClickCallback,
    id,
    title,
    branchOf,
  }: ChatItemProps) => {
    const [showChangeTitleModal, setShowChangeTitleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const showStatusIndicator = useAtomValue(showChatStatusIndicatorAtom);
    const chatStatusIndicators = useAtomValue(chatStatusIndicatorsAtom);

    const isSelectedChat = activeChatId === id;
    const statusIndicator = showStatusIndicator
      ? chatStatusIndicators[id]
      : null;

    return (
      <>
        <Button
          variant={isSelectedChat ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "group/chat-item w-full justify-between py-2 pr-1 pl-2 transition-none",
            isSelectedChat && "border pl-[calc(0.5rem-1px)]",
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
          onClick={() =>
            additionalOnChatClickCallback && additionalOnChatClickCallback(id)
          }
        >
          <Link to={`/chat/${id}`} className="relative block overflow-hidden">
            <span className="flex min-w-0 items-center gap-1.5 text-sm font-normal">
              <StatusIndicator status={statusIndicator} />
              {branchOf && <GitBranch className="text-foreground size-3" />}
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
                <DropdownMenuContent align="end" className="w-fit">
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Link>
        </Button>

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
