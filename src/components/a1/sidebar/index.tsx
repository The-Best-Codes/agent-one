import { useAtom } from "jotai";
import { PlusIcon, SearchIcon, SettingsIcon, SidebarIcon } from "lucide-react";
import { Activity, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Link, useNavigate, useParams } from "react-router";

import { ModelSelector } from "@/components/a1/model-selector";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { sidebarCollapsedAtom } from "@/lib/jotai/atoms";
import { kbdRegistry } from "@/lib/kbd-registry";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { ChatList } from "./chat-list";
import { SearchModal } from "./search-modal";

const logger = getLogger(import.meta.url);

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({
  activeChatId,
  handleNewChat,
  onChatClick,
}: {
  activeChatId?: string;
  handleNewChat: () => void;
  onChatClick?: (id: string) => void;
}) => {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-row items-center justify-center">
        <span className="text-xl">AgentOne</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatList
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
          onChatClick={onChatClick}
        />
      </div>

      <div className="border-sidebar-border flex flex-col items-center justify-center gap-2 pt-2">
        <ModelSelector className="w-full" popoverClassName="w-full max-w-60" />
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/settings">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useAtom(sidebarCollapsedAtom);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  const isSidebarSmall = isCollapsed || !isDesktop;

  useHotkeys(kbdRegistry.focusChatSearchCollapsed, () => {
    if (isSidebarSmall) {
      setIsSearchModalOpen(true);
    }
  });

  useHotkeys(kbdRegistry.toggleSidebar, () => {
    setIsSearchModalOpen(false);
    setIsCollapsed(!isCollapsed);
  });

  const handleNewChat = () => {
    logger.verbose("Creating new chat", { isDesktop, isDrawerOpen });
    navigate("/chat");
    if (!isDesktop) {
      setIsDrawerOpen(false);
    }
  };

  const handleSearchClick = () => {
    logger.verbose("Opening search modal");
    setIsSearchModalOpen(true);
  };

  const sidebarButton = isDesktop ? (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsCollapsed(!isCollapsed)}
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="size-6"
    >
      <SidebarIcon />
    </Button>
  ) : (
    <Drawer direction="left" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Expand sidebar"
          className="size-6"
        >
          <SidebarIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="bg-sidebar border-sidebar-border h-full !max-w-64 border-r p-2"
      >
        <DrawerTitle className="sr-only">Chat Sidebar</DrawerTitle>
        <DrawerDescription className="sr-only">
          Mobile chat sidebar content
        </DrawerDescription>
        <SidebarContent
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
          onChatClick={() => setIsDrawerOpen(false)}
        />
      </DrawerContent>
    </Drawer>
  );

  return (
    <>
      <div className="animate-in fade-in-0 fixed top-0 left-0 z-50 duration-300 md:top-2 md:left-2">
        <div
          className={cn(
            "bg-background border-sidebar-border flex items-center gap-1 rounded-none rounded-br-md border-0 border-r-1 border-b-1 p-1 transition-[border,padding,background-color] duration-200 md:rounded-md md:border-1",
            !isSidebarSmall && "border-transparent bg-transparent pt-0 pl-0",
          )}
        >
          {sidebarButton}
          <div
            className={cn(
              "flex translate-x-0 scale-100 items-center gap-1 opacity-100 transition-[opacity,scale,translate] duration-100",
              !isSidebarSmall &&
                "pointer-events-none -translate-x-2 scale-95 opacity-0",
            )}
            inert={!isCollapsed}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={handleSearchClick}
              aria-label="Search chats"
              className="size-6"
            >
              <SearchIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              aria-label="New chat"
              className="size-6"
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
            isSidebarSmall
              ? "pointer-events-none w-0 -translate-x-full opacity-0"
              : "w-64 translate-x-0 opacity-100",
            className,
          )}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-[scale,opacity] duration-200",
              isSidebarSmall ? "scale-95 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <Activity mode={isSidebarSmall ? "hidden" : "visible"}>
              <SidebarContent
                activeChatId={activeChatId}
                handleNewChat={handleNewChat}
              />
            </Activity>
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
