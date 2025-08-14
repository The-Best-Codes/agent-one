import { Button } from "@/components/ui/button";
import { deleteChat, listChatIds, loadChat } from "@/lib/ai/persistence";
import type { TextUIPart, UIMessage } from "ai";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

interface ChatListItem {
  id: string;
  title: string;
}

const getChatTitle = (messages: UIMessage[]): string => {
  if (!messages || messages.length === 0) {
    return "New Chat";
  }

  const firstUserMessageWithText = messages.find(
    (m) =>
      m.role === "user" &&
      m.parts.some(
        (p) =>
          p.type === "text" &&
          (p as TextUIPart).text &&
          (p as TextUIPart).text.trim() !== "",
      ),
  );

  if (firstUserMessageWithText) {
    const textPart = firstUserMessageWithText.parts.find(
      (p) => p.type === "text",
    ) as TextUIPart | undefined;
    if (textPart?.text) {
      const title = textPart.text.trim();
      return title.length > 28 ? `${title.substring(0, 28)}...` : title;
    }
  }

  return "Untitled Chat";
};

export const ChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const { id: activeChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const refreshChats = useCallback(() => {
    const ids = listChatIds();
    const chatListItems = ids.map((id) => {
      const messages = loadChat(id);
      return { id, title: getChatTitle(messages) };
    });
    setChats(chatListItems);
  }, []);

  useEffect(() => {
    refreshChats();

    const handleChatCreated = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      const messages = loadChat(chatId);
      setChats((prev) => [
        { id: chatId, title: getChatTitle(messages) },
        ...prev,
      ]);
    };

    const handleChatUpdated = (event: Event) => {
      const { chatId, messages } = (event as CustomEvent).detail;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, title: getChatTitle(messages) }
            : chat,
        ),
      );
    };

    const handleChatDeleted = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    };

    window.addEventListener("persistence:chat-created", handleChatCreated);
    window.addEventListener("persistence:chat-updated", handleChatUpdated);
    window.addEventListener("persistence:chat-deleted", handleChatDeleted);

    return () => {
      window.removeEventListener("persistence:chat-created", handleChatCreated);
      window.removeEventListener("persistence:chat-updated", handleChatUpdated);
      window.removeEventListener("persistence:chat-deleted", handleChatDeleted);
    };
  }, [refreshChats]);

  const handleNewChat = () => {
    navigate("/chat");
  };

  const handleDeleteChat = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    chatId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: A confirmation dialog would be a good addition here in the future
    deleteChat(chatId);
    if (activeChatId === chatId) {
      navigate("/chat");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1">
        {chats.map((chat) => (
          <Link to={`/chat/${chat.id}`} key={chat.id} className="block">
            <Button
              variant={activeChatId === chat.id ? "secondary" : "ghost"}
              className="w-full justify-between group pr-2"
            >
              <span className="truncate text-sm font-normal">{chat.title}</span>
              <div className="size-0 group-hover:size-6 focus-within:size-6 shrink-0 overflow-hidden focus-within:overflow-visible">
                <Button
                  size="icon"
                  variant="default"
                  className="text-destructive bg-transparent hover:text-white hover:bg-destructive size-6"
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </Button>
          </Link>
        ))}
      </nav>
    </div>
  );
};
