"use client";

import { Loader } from "@/components/a1/smooth-loader";
import ThemeToggle from "@/components/a1/theme-switcher";
import { Button } from "@/components/ui/button";
import { getAllChatIds } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SidebarProps {
  currentChatId?: string | null;
}

export const Sidebar = ({ currentChatId }: SidebarProps) => {
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadChatIds();
  }, []);

  return (
    <div className="w-64 bg-background border-r border-border py-4 px-4">
      <h2 className="text-lg font-semibold mb-4">AgentOne</h2>

      <Button asChild variant="default" className="w-full mb-4">
        <div className="flex flex-row justify-center items-center gap-2">
          <Plus />
          <Link href="/">New Chat</Link>
        </div>
      </Button>
      {loading ? (
        <div className="flex flex-row gap-2 justify-center items-center">
          <Loader className="animate-spin" />
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
            <li key={id} className="mb-1">
              <Button
                asChild
                variant={currentChatId === id ? "secondary" : "ghost"}
                className={cn(
                  "block max-w-full w-full truncate",
                  currentChatId === id ? "" : "hover:bg-sidebar",
                )}
              >
                <Link href={`/?chatId=${id}`}>Chat {id}</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ThemeToggle />
    </div>
  );
};
