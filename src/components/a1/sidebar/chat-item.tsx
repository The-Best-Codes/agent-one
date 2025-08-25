import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
    setIsConfirmingDelete(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleEditChat = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmingDelete(false);
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
    <Button
      variant={activeChatId === id ? "secondary" : "ghost"}
      className={cn(
        "group/chat-item w-full justify-between py-2 pr-2 transition-none",
        isEditing && "pl-2",
      )}
      asChild
    >
      <Link to={`/chat/${id}`} className="block">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={handleInputClick}
            className="bg-background ml-1 h-6 rounded-md border-none p-0 px-1 text-sm font-normal shadow-none"
            autoFocus
          />
        ) : (
          <span className="truncate text-sm font-normal">{title}</span>
        )}

        <div
          className={cn(
            "flex shrink-0 items-center gap-1 overflow-hidden transition-[width,height] duration-200",
            {
              "h-12 w-13": isEditing || isConfirmingDelete,
              "size-0 group-hover/chat-item:h-12 group-hover/chat-item:w-13 focus-within:h-12 focus-within:w-13":
                !isEditing && !isConfirmingDelete,
            },
          )}
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
                <CheckIcon className="size-4" />
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
                <XIcon className="size-4" />
              </Button>
            </>
          ) : isConfirmingDelete ? (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-6"
                    onClick={(e) => handleConfirmDeleteChat(e, id)}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Delete Chat</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="default"
                    className="size-6"
                    onClick={handleCancelDelete}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Cancel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              <Button
                size="icon"
                variant="default"
                className="text-foreground hover:bg-primary hover:text-primary-foreground size-6 border-none bg-transparent shadow-none"
                onClick={handleEditChat}
              >
                <PencilIcon className="size-4" />
              </Button>

              <Button
                size="icon"
                variant="default"
                className="text-destructive hover:bg-destructive size-6 border-none bg-transparent shadow-none hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(false);
                  setIsConfirmingDelete(true);
                }}
              >
                <TrashIcon className="size-4" />
              </Button>
            </>
          )}
        </div>
      </Link>
    </Button>
  );
});

ChatItem.displayName = "ChatItem";
