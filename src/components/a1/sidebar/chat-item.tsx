import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "lucide-react";
import { memo, useState } from "react";
import { Link, useParams } from "react-router";
import { ChangeTitleModal, DeleteChatModal, ExportChatModal } from "./modals";

interface ChatItemProps {
  id: string;
  title: string;
}

export const ChatItem = memo(({ id, title }: ChatItemProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const [showChangeTitleModal, setShowChangeTitleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <>
      <Button
        variant={activeChatId === id ? "secondary" : "ghost"}
        size="sm"
        className="group/chat-item w-full justify-between py-2 pr-1 pl-2 transition-none"
        asChild
      >
        <Link to={`/chat/${id}`} className="relative block overflow-hidden">
          <span className="truncate text-sm font-normal">{title}</span>
          <div
            className={cn(
              "absolute right-0 flex size-8 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/chat-item:opacity-100 focus-within:opacity-100",
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
});

ChatItem.displayName = "ChatItem";
