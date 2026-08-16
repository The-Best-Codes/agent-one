import { IconLayoutSidebar, IconPlus, IconSearch, IconSettings } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useMediaQuery } from "@/hooks/use-media-query";
import { collapsedSidebarLayoutAtom } from "@/lib/jotai/settings-atoms";
import { debugModeEnabledAtom, sidebarCollapsedAtom } from "@/lib/jotai/unsynced-local-atoms";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [debugMode, setDebugMode] = useAtom(debugModeEnabledAtom);
  const clickTimestamps = useRef<number[]>([]);

  const handleTitleClick = useCallback(() => {
    if (debugMode) return;
    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter((ts) => now - ts < 1500);
    if (clickTimestamps.current.length >= 5) {
      clickTimestamps.current = [];
      toast(t("sidebar.debugEnableQuestion"), {
        id: "enable-debug-mode",
        description: t("sidebar.debugEnableQuestionDescription"),
        action: {
          label: t("common.enable"),
          onClick: () => {
            setDebugMode(true);
            toast.success(t("sidebar.debugEnabled"), {
              description: t("sidebar.debugEnabledDescription"),
              action: {
                label: t("sidebar.openSettings"),
                onClick: () => navigate("/settings?tab=about"),
              },
            });
          },
        },
        duration: Infinity,
      });
    }
  }, [navigate, debugMode, setDebugMode, t]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-row items-center justify-center gap-2">
        <span className="cursor-default text-xl select-none" onClick={handleTitleClick}>
          AgentOne
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatList
          activeChatId={activeChatId}
          handleNewChat={handleNewChat}
          onChatClick={onChatClick}
        />
      </div>

      <div className="border-sidebar-border flex flex-col gap-2 pt-2">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link
            to={`/settings${activeChatId ? `?chatId=${activeChatId}` : ""}`}
            data-icon="inline-start"
          >
            <IconSettings data-icon="inline-start" />
            {t("common.settings")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const Sidebar = ({ className }: SidebarProps) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useAtom(sidebarCollapsedAtom);
  const [collapsedLayout] = useAtom(collapsedSidebarLayoutAtom);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  const isSidebarSmall = isCollapsed || !isDesktop;
  const isColumnLayout = collapsedLayout === "column";
  const toggleTooltip = (isDesktop ? isCollapsed : !isDrawerOpen)
    ? t("sidebar.openSidebar")
    : t("sidebar.closeSidebar");
  const tooltipSide = isColumnLayout && isSidebarSmall ? "right" : undefined;

  useKeyboardShortcut("focusChatSearchCollapsed", () => {
    if (isSidebarSmall) {
      setIsSearchModalOpen(true);
    }
  });

  useKeyboardShortcut("toggleSidebar", () => {
    setIsSearchModalOpen(false);
    if (isDesktop) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsDrawerOpen(!isDrawerOpen);
    }
  });

  const handleNewChat = () => {
    logger.verbose("Creating new chat", { isDesktop, isDrawerOpen });
    void navigate("/chat");
    if (!isDesktop) {
      setIsDrawerOpen(false);
    }
  };

  const handleSearchClick = () => {
    logger.verbose("Opening search modal");
    setIsSearchModalOpen(true);
  };

  const sidebarButton = isDesktop ? (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          analytics={{
            event: "sidebar_toggled",
            params: { collapsed: !isCollapsed, ui_location: "desktop" },
          }}
          aria-label={isCollapsed ? t("sidebar.openSidebar") : t("sidebar.closeSidebar")}
          className="size-6"
        >
          <IconLayoutSidebar data-icon="inline-start" />
        </Button>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent side={tooltipSide}>{toggleTooltip}</AdaptiveTooltipContent>
    </AdaptiveTooltip>
  ) : (
    <Drawer direction="left" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <AdaptiveTooltip>
        <AdaptiveTooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label={toggleTooltip} className="size-6">
              <IconLayoutSidebar />
            </Button>
          </DrawerTrigger>
        </AdaptiveTooltipTrigger>
        <AdaptiveTooltipContent>{toggleTooltip}</AdaptiveTooltipContent>
      </AdaptiveTooltip>
      <DrawerContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="bg-background dark:bg-sidebar border-sidebar-border h-full max-w-64! border-r p-2"
      >
        <DrawerTitle className="sr-only">{t("sidebar.chatSidebar")}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("sidebar.mobileSidebarDescription")}
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
      <div className="animate-in fade-in-0 fixed top-0 left-0 z-50 transition-opacity duration-300 md:top-2 md:left-2">
        <div
          className={cn(
            "bg-background border-sidebar-border flex items-center gap-1 rounded-none border-0 border-r border-b p-1 transition-[padding,background-color] duration-200 md:rounded-md md:border",
            !isSidebarSmall && "border-transparent bg-transparent pt-0 pl-0",
            isColumnLayout && "flex-col",
          )}
        >
          {sidebarButton}
          <div
            className={cn(
              "flex translate-x-0 scale-100 items-center gap-1 opacity-100 transition-[opacity,scale,translate] duration-100",
              !isSidebarSmall &&
                !isColumnLayout &&
                "pointer-events-none -translate-x-2 scale-95 opacity-0",
              !isSidebarSmall &&
                isColumnLayout &&
                "pointer-events-none -translate-y-2 scale-95 opacity-0",
              isColumnLayout && "flex-col",
            )}
            inert={!isSidebarSmall}
          >
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleSearchClick}
                  analytics={{ event: "search_modal_opened", params: { ui_location: "sidebar" } }}
                  aria-label={t("sidebar.searchChats")}
                  className="size-6"
                >
                  <IconSearch data-icon="inline-start" />
                </Button>
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent side={tooltipSide}>
                {t("sidebar.searchChats")}
              </AdaptiveTooltipContent>
            </AdaptiveTooltip>
            <AdaptiveTooltip>
              <AdaptiveTooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handleNewChat}
                  analytics={{ event: "new_chat_clicked", params: { ui_location: "sidebar" } }}
                  aria-label={t("sidebar.newChat")}
                  className="size-6"
                >
                  <IconPlus data-icon="inline-start" />
                </Button>
              </AdaptiveTooltipTrigger>
              <AdaptiveTooltipContent side={tooltipSide}>
                {t("sidebar.newChat")}
              </AdaptiveTooltipContent>
            </AdaptiveTooltip>
          </div>
        </div>
      </div>

      {isDesktop && (
        <aside
          className={cn(
            "bg-background dark:bg-sidebar border-sidebar-border flex h-full flex-col overflow-hidden border-r p-2 transition-[translate,opacity,width,padding] duration-200",
            isSidebarSmall
              ? "pointer-events-none w-0 p-0 border-0 -translate-x-full opacity-0"
              : "w-64 translate-x-0 opacity-100",
            className,
          )}
          inert={isSidebarSmall}
        >
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-[scale,opacity] duration-200",
              isSidebarSmall ? "scale-95 opacity-0" : "scale-100 opacity-100",
            )}
          >
            <SidebarContent activeChatId={activeChatId} handleNewChat={handleNewChat} />
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
