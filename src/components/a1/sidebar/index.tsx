import { ModelSelector } from "@/components/a1/model-selector";
import ThemeTabs from "@/components/theme/tabs-menu";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { ChatList } from "./chat-list";

// TODO: Give sidebar even padding in all parts and on all states (collapsed, mobile expanded, desktop expanded)

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({
  setIsCollapsed,
  hideCollapseButton,
}: {
  setIsCollapsed: (value: boolean) => void;
  hideCollapseButton?: boolean;
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <ChatList />
      </div>

      <div className="pt-2 border-t border-sidebar-border flex flex-col items-center justify-center gap-2">
        <ModelSelector className="w-full" popoverClassName="w-full" />
        <ThemeTabs className="w-full" />

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

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <aside
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col p-2",
          isCollapsed ? "w-13 items-center" : "w-64",
          className,
        )}
      >
        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col min-h-0">
              <SidebarContent setIsCollapsed={setIsCollapsed} />
            </div>
          </>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-13 p-2 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center justify-end",
        className,
      )}
    >
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Expand sidebar">
            <ChevronRightIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="!max-w-64 h-full p-2 bg-sidebar border-r border-sidebar-border">
          <SidebarContent setIsCollapsed={setIsCollapsed} hideCollapseButton />
        </DrawerContent>
      </Drawer>
    </aside>
  );
};
