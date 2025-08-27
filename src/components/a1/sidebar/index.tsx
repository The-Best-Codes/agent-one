import { ModelSelector } from "@/components/a1/model-selector";
import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  PlusIcon,
  SearchIcon,
  SidebarIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChatList } from "./chat-list";
import { SearchModal } from "./search-modal";

const logger = getLogger(import.meta.url);

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({
  setIsCollapsed,
  hideCollapseButton,
  activeChatId,
  handleNewChat,
}: {
  setIsCollapsed: (value: boolean) => void;
  hideCollapseButton?: boolean;
  activeChatId?: string;
  handleNewChat: () => void;
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatList activeChatId={activeChatId} handleNewChat={handleNewChat} />
      </div>

      <div className="border-sidebar-border flex flex-col items-center justify-center gap-2 pt-2">
        <ModelSelector className="w-full" popoverClassName="w-full" />
        <ThemeToggle className="w-full" />

        {!hideCollapseButton && (
          <Button
            variant="outline"
            onClick={() => setIsCollapsed(true)}
            className="w-full"
          >
            <span className="sr-only">Collapse Sidebar</span>
            <ChevronLeftIcon />
          </Button>
        )}
      </div>
    </div>
  );
};

const CollapsedIconContainer = ({
  handleNewChat,
  expandButton,
  onSearchClick,
}: {
  handleNewChat: () => void;
  expandButton: React.ReactNode;
  onSearchClick: () => void;
}) => {
  return (
    <div className="fixed top-0 left-0 z-50 md:top-2 md:left-2">
      <div className="bg-background border-sidebar-border flex items-center gap-1 rounded-none rounded-br-md border-0 border-r-1 border-b-1 p-1 md:rounded-md md:border-1">
        {expandButton}
        <Button
          variant="outline"
          size="icon"
          onClick={onSearchClick}
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

  if (!isDesktop || isCollapsed) {
    const expandButton = isDesktop ? (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCollapsed(false)}
        aria-label="Expand sidebar"
        className="size-6 pointer-coarse:size-8"
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
          <SidebarContent
            setIsCollapsed={setIsCollapsed}
            hideCollapseButton
            activeChatId={activeChatId}
            handleNewChat={handleNewChat}
          />
        </DrawerContent>
      </Drawer>
    );

    return (
      <>
        <CollapsedIconContainer
          handleNewChat={handleNewChat}
          expandButton={expandButton}
          onSearchClick={handleSearchClick}
        />
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
        />
      </>
    );
  }

  return (
    <aside
      className={cn(
        "bg-sidebar border-sidebar-border flex h-full w-64 flex-col border-r p-2",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <SidebarContent
          setIsCollapsed={setIsCollapsed}
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
        />
      </div>
    </aside>
  );
};
