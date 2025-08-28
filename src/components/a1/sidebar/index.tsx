import { ModelSelector } from "@/components/a1/model-selector";
import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { PlusIcon, SearchIcon, SidebarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatList } from "./chat-list";
import { SearchModal } from "./search-modal";

const logger = getLogger(import.meta.url);

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({
  activeChatId,
  handleNewChat,
}: {
  activeChatId?: string;
  handleNewChat: () => void;
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-row items-center justify-center">
        <span className="text-xl">AgentOne</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatList activeChatId={activeChatId} handleNewChat={handleNewChat} />
      </div>

      <div className="border-sidebar-border flex flex-col items-center justify-center gap-2 pt-2">
        <ModelSelector className="w-full" popoverClassName="w-full" />
        <ThemeToggle className="w-full" />
      </div>
    </div>
  );
};

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      logger.error("Error retrieving sidebar state from localStorage:", error);
      return false;
    }
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    } catch (error) {
      logger.error("Error saving sidebar state to localStorage:", error);
    }
  }, [isCollapsed]);

  const handleNewChat = () => {
    navigate("/chat");
  };

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const sidebarButton = isDesktop ? (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsCollapsed(!isCollapsed)}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn("size-6 pointer-coarse:size-8", !isCollapsed && "!size-6")}
    >
      <SidebarIcon />
    </Button>
  ) : (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Expand sidebar"
          className="size-6 pointer-coarse:size-8"
        >
          <SidebarIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-sidebar border-sidebar-border h-full !max-w-64 border-r p-2">
        <DrawerTitle className="sr-only">Chat Sidebar</DrawerTitle>
        <SidebarContent
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
        />
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      <div className="fixed top-0 left-0 z-50 md:top-2 md:left-2">
        <div
          className={cn(
            "bg-background border-sidebar-border flex items-center gap-1 rounded-none rounded-br-md border-0 border-r-1 border-b-1 p-1 transition-[border,padding,background-color] duration-200 md:rounded-md md:border-1",
            !isCollapsed && "border-transparent bg-transparent pt-0 pl-0",
          )}
        >
          {sidebarButton}
          <div
            className={cn(
              "flex items-center gap-1 transition-[opacity,scale,translate] duration-200",
              isCollapsed
                ? "translate-x-0 scale-100 opacity-100"
                : "pointer-events-none -translate-x-2 scale-95 opacity-0",
            )}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={handleSearchClick}
              aria-label="Search chats"
              className="size-6 pointer-coarse:size-8"
            >
              <SearchIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              aria-label="New chat"
              className="size-6 pointer-coarse:size-8"
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </div>

      {isDesktop && (
        <aside
          className={cn(
            "bg-sidebar border-sidebar-border flex h-full flex-col overflow-hidden border-r p-2 transition-[translate,opacity,width] duration-200",
            isCollapsed
              ? "pointer-events-none w-0 -translate-x-full opacity-0"
              : "w-64 translate-x-0 opacity-100",
            className,
          )}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-[scale,opacity] duration-200",
              isCollapsed ? "scale-95 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <SidebarContent
              activeChatId={activeChatId}
              handleNewChat={handleNewChat}
            />
          </div>
        </aside>
      )}

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        activeChatId={activeChatId}
      />
    </>
  );
};
