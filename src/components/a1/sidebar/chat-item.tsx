import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { deleteChat, saveChatTitle } from "@/lib/ai/persistence";
import { cn } from "@/lib/utils";
import { CheckIcon, PencilIcon, TrashIcon, XIcon } from "lucide-react";
import { memo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

interface ChatItemProps {
  id: string;
  title: string;
}

export const ChatItem = memo(({ id, title }: ChatItemProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDeleteChat = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    chatId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    deleteChat(chatId);
    if (activeChatId === chatId) {
      navigate("/chat");
    }
    setIsDeleteDialogOpen(false);
  };

  const handleEditChat = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTitle(title);
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== title) {
      saveChatTitle({ chatId: id, title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link to={`/chat/${id}`} className="block">
      <Button
        variant={activeChatId === id ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-between group/chat-item py-2 pr-2 transition-none",
          isEditing && "pl-2",
        )}
      >
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            // TODO: h-5 solves text shifting issues, but h-6 is more consistent with other elements. Resolve this.
            className="h-6 text-sm font-normal bg-background border-none shadow-none p-0 px-1 ml-1 rounded-md"
            autoFocus
          />
        ) : (
          <span className="truncate text-sm font-normal">{title}</span>
        )}

        <div
          className={`shrink-0 overflow-hidden flex items-center gap-1 transition-all duration-200 ${
            isEditing || isDeleteDialogOpen
              ? "w-13 h-12"
              : "size-0 group-hover/chat-item:w-13 group-hover/chat-item:h-12 focus-within:w-13 focus-within:h-12 focus-within:overflow-visible"
          }`}
        >
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="default"
                className="size-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveTitle();
                }}
              >
                <CheckIcon />
              </Button>
              <Button
                size="icon"
                variant="default"
                className="size-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelEdit();
                }}
              >
                <XIcon />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="default"
                className="bg-transparent text-foreground hover:bg-primary hover:text-primary-foreground border-none shadow-none size-6"
                onClick={handleEditChat}
              >
                <PencilIcon />
              </Button>

              <Popover
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="default"
                    className="text-destructive bg-transparent hover:text-white hover:bg-destructive border-none shadow-none size-6"
                  >
                    <TrashIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto flex gap-1 p-1"
                  side="bottom"
                  align="center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-6"
                    onClick={(e) => handleConfirmDeleteChat(e, id)}
                  >
                    <CheckIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    className="size-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(false);
                    }}
                  >
                    <XIcon />
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </Button>
    </Link>
  );
});

ChatItem.displayName = "ChatItem";
