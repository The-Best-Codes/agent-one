import { Button } from "@/components/ui/button";
import { deleteChat } from "@/lib/ai/persistence";
import { TrashIcon } from "lucide-react";
import { memo } from "react";
import { Link, useNavigate, useParams } from "react-router";

interface ChatItemProps {
  id: string;
  title: string;
}

export const ChatItem = memo(({ id, title }: ChatItemProps) => {
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleDeleteChat = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    chatId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    deleteChat(chatId);
    if (activeChatId === chatId) {
      navigate("/chat");
    }
  };

  return (
    <Link to={`/chat/${id}`} className="block">
      <Button
        variant={activeChatId === id ? "secondary" : "ghost"}
        className="w-full justify-between group pr-2"
      >
        <span className="truncate text-sm font-normal">{title}</span>
        <div className="size-0 group-hover:size-6 focus-within:size-6 shrink-0 overflow-hidden focus-within:overflow-visible">
          <Button
            size="icon"
            variant="default"
            className="text-destructive bg-transparent hover:text-white hover:bg-destructive size-6"
            onClick={(e) => handleDeleteChat(e, id)}
          >
            <TrashIcon />
          </Button>
        </div>
      </Button>
    </Link>
  );
});

ChatItem.displayName = "ChatItem";
