"use client";

import { Loader } from "@/components/a1/smooth-loader";
import ThemeToggle from "@/components/a1/theme-switcher";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllChatIds } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  currentChatId?: string | null;
}

export const Sidebar = ({ currentChatId }: SidebarProps) => {
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadChatIds = async () => {
    setLoading(true);
    try {
      const ids = await getAllChatIds();
      setChatIds(ids);
    } catch (error) {
      console.error("Failed to load chat IDs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatIds();
  }, []);

  const handleCreateNewChat = async () => {
    try {
      router.push("/");
    } catch (error) {
      console.error("Failed to create new chat:", error);
    } finally {
      loadChatIds();
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
              {chatIds.map((id) => (
                <li key={id} className="mb-2">
                  <Button
                    asChild
                    variant={currentChatId === id ? "secondary" : "ghost"}
                    className={cn(
                      "block max-w-full w-full truncate justify-start",
                      currentChatId === id ? "" : "hover:bg-secondary/50",
                    )}
                  >
                    <Link href={`/?chatId=${id}`}>{id}</Link>
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
