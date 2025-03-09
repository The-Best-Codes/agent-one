"use client";

import { Loader } from "@/components/a1/smooth-loader";
import ThemeToggle from "@/components/a1/theme-switcher";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatName } from "@/lib/chat-name-store";
import { getAllChatIds } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Inbox, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
  currentChatId?: string | null;
  handleChatIdChange: (chatId?: string | null, type?: string) => Promise<void>;
}

export const Sidebar = ({
  currentChatId,
  handleChatIdChange,
}: SidebarProps) => {
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatNames, setChatNames] = useState<{ [chatId: string]: string }>({});

  const loadChatIds = async () => {
    setLoading(true);
    try {
      const ids = await getAllChatIds();
      setChatIds(ids);
      // Load chat names in parallel after fetching chat IDs
      const names: { [chatId: string]: string } = {};
      await Promise.all(
        ids.map(async (id) => {
          names[id] = (await getChatName(id)) || "New Chat";
        }),
      );
      setChatNames(names);
    } catch (error) {
      console.error("Failed to load chat IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatIds();
  }, []);

  useEffect(() => {
    // Check if the current chat ID exists in the loaded chat IDs
    if (
      currentChatId &&
      chatIds.length > 0 &&
      !chatIds.includes(currentChatId)
    ) {
      loadChatIds(); // Reload if current chat ID is not found after initial load
    }
  }, [currentChatId, chatIds]);

  const handleCreateNewChat = async () => {
    try {
      await handleChatIdChange(undefined, "new");
    } catch (error) {
      console.error("Failed to create new chat:", error);
    } finally {
      await loadChatIds(); // Load chat IDs after creating a new chat
    }
  };

  const handleChatButtonClick = async (id: string) => {
    try {
      if (currentChatId !== id) {
        await handleChatIdChange?.(id);
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
          {loading ? (
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
              {chatIds.map((id) => {
                const chatName = chatNames[id] || "New Chat";
                return (
                  <li key={id} className="mb-2">
                    <Button
                      asChild
                      variant={currentChatId === id ? "secondary" : "ghost"}
                      className={cn(
                        "block cursor-pointer max-w-full w-full truncate justify-start",
                        currentChatId === id ? "" : "hover:bg-secondary/50",
                      )}
                      onClick={async () => await handleChatButtonClick(id)}
                    >
                      <span>{chatName}</span>
                    </Button>
                  </li>
                );
              })}
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
