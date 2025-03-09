"use client";

import { Loader } from "@/components/a1/smooth-loader";
import ThemeToggle from "@/components/a1/theme-switcher";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Inbox, Plus } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";

export const Sidebar = () => {
  const {
    chatIds,
    chatId,
    isLoadingInitial,
    createNewChat,
    switchChat,
  } = useChatContext();

  const handleCreateNewChat = async () => {
    try {
      await createNewChat();
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleChatButtonClick = async (id: string) => {
    try {
      if (chatId !== id) {
        await switchChat(id);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">AgentOne</h2>

        <Button
          variant="default"
          className="w-full"
          onClick={handleCreateNewChat}
        >
          <div className="flex flex-row justify-center items-center gap-2">
            <Plus />
            New Chat
          </div>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 pt-0">
          {isLoadingInitial ? (
            <div className="flex flex-row gap-2 justify-center items-center">
              <Loader />
              <span>Loading chats...</span>
            </div>
          ) : chatIds.length === 0 ? (
            <div className="flex flex-col gap-2 mt-4 justify-center items-center">
              <Inbox className="w-16 h-16 text-muted" />
              <span>No chats yet</span>
            </div>
          ) : (
            <ul>
              {chatIds.map((id) => (
                <li key={id} className="mb-2">
                  <Button
                    asChild
                    variant={chatId === id ? "secondary" : "ghost"}
                    className="block cursor-pointer max-w-full w-full truncate justify-start"
                    onClick={async () => await handleChatButtonClick(id)}
                  >
                    <span>{id}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <ThemeToggle />
      </div>
    </div>
  );
};
