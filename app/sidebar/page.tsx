"use client";

import ThemeToggle from "@/components/a1/theme-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ChatSidebarProps {
  chats: { id: string; title: string }[];
  currentChatId: string | null;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, currentChatId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-screen w-64 border-r bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center mb-2"
        >
          New Chat <Plus className="ml-2 h-4 w-4" />
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 py-1.5 text-sm w-full"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {filteredChats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chats found.</p>
          ) : (
            filteredChats.map((chat) => (
              <Button
                variant="ghost"
                key={chat.id}
                className={cn(
                  "w-full justify-start text-left font-normal hover:bg-accent hover:text-accent-foreground text-sm truncate",
                  currentChatId === chat.id &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => router.push(`/chat/${chat.id}`)}
              >
                {chat.title}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Bottom Section: Theme Picker */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          {/* Optional: Add other settings or user info here */}
        </div>
      </div>
    </div>
  );
};

export default function page() {
  const [chats, setChats] = useState([
    { id: "1", title: "Summarize meeting notes" },
    { id: "2", title: "Write a blog post about AI" },
    { id: "3", title: "Translate to Spanish, summarize, make it fun." },
    { id: "4", title: "Help with my Physics Homework" },
    { id: "5", title: "Generate code for my project." },
    { id: "6", title: "Explain quantum physics in simple terms" },
    { id: "7", title: "Draft an email to my boss" },
    { id: "8", title: "Brainstorming session notes" },
    { id: "9", title: "Recipe for chocolate cake" },
    { id: "10", title: "Creative writing prompts" },
    { id: "11", title: "Plan my vacation" },
    { id: "12", title: "Review my essay" },
  ]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <ChatSidebar chats={chats} currentChatId={currentChatId} />
      <div className="flex-1 p-4">
        {currentChatId ? (
          <div>
            <h2>Chat Content</h2>
            <p>Displaying chat content for ID: {currentChatId}</p>
          </div>
        ) : (
          <div>
            <h2>Welcome!</h2>
            <p>Select a chat from the sidebar to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
