import { Button } from "@/components/ui/button";
import { useModel } from "@/contexts/use-model/model-hooks";
import {
  deleteChat,
  listChatIds,
  loadChatData,
  saveChatTitle,
} from "@/lib/ai/persistence";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

interface ChatListItem {
  id: string;
  title: string;
}

const getChatTitle = (title: string): string => {
  return title;
};

export const ChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const { id: activeChatId } = useParams<{ id: string }>();
  const { currentModel } = useModel();
  const navigate = useNavigate();

  const generateTitleForChat = useCallback(
    async (chatId: string) => {
      try {
        const chatData = loadChatData(chatId);

        if (chatData.title !== "New chat" || chatData.messages.length === 0) {
          return;
        }

        const hasUserMessage = chatData.messages.some((m) => m.role === "user");

        if (!hasUserMessage) {
          return;
        }

        const generatedTitle = await generateChatTitle(
          currentModel.model,
          chatData.messages,
        );

        saveChatTitle({ chatId, title: generatedTitle });
      } catch (error) {
        console.error("Failed to generate title for chat:", chatId, error);
      }
    },
    [currentModel.model],
  );

  const refreshChats = useCallback(() => {
    const ids = listChatIds();
    const chatListItems = ids.map((id) => {
      const chatData = loadChatData(id);
      return {
        id,
        title: getChatTitle(chatData.title),
      };
    });
    setChats(chatListItems);
  }, []);

  useEffect(() => {
    refreshChats();

    const handleChatCreated = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      const chatData = loadChatData(chatId);
      setChats((prev) => [
        {
          id: chatId,
          title: getChatTitle(chatData.title),
        },
        ...prev,
      ]);
    };

    const handleChatUpdated = (event: Event) => {
      const { chatId, chatData } = (event as CustomEvent).detail;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: getChatTitle(chatData?.title || "New chat"),
              }
            : chat,
        ),
      );

      generateTitleForChat(chatId);
    };

    const handleChatTitleUpdated = (event: Event) => {
      const { chatId, title } = (event as CustomEvent).detail;
      setChats((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat)),
      );
    };

    const handleChatDeleted = (event: Event) => {
      const { chatId } = (event as CustomEvent).detail;
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    };

    window.addEventListener("persistence:chat-created", handleChatCreated);
    window.addEventListener("persistence:chat-updated", handleChatUpdated);
    window.addEventListener("persistence:chat-deleted", handleChatDeleted);
    window.addEventListener(
      "persistence:chat-title-updated",
      handleChatTitleUpdated,
    );

    return () => {
      window.removeEventListener("persistence:chat-created", handleChatCreated);
      window.removeEventListener("persistence:chat-updated", handleChatUpdated);
      window.removeEventListener("persistence:chat-deleted", handleChatDeleted);
      window.removeEventListener(
        "persistence:chat-title-updated",
        handleChatTitleUpdated,
      );
    };
  }, [refreshChats, generateTitleForChat]);

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
