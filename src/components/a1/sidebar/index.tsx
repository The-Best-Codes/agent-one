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
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatList />
      </div>

      <div className="border-sidebar-border flex flex-col items-center justify-center gap-2 border-t pt-2">
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
          "bg-sidebar border-sidebar-border flex h-full flex-col border-r p-2",
          isCollapsed ? "w-13 items-center" : "w-64",
          className,
        )}
      >
        {isCollapsed ? (
          <div className="flex flex-1 flex-col items-center justify-end">
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
            <div className="flex min-h-0 flex-1 flex-col">
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
        "bg-sidebar border-sidebar-border flex h-full w-13 flex-col items-center justify-end border-r p-2",
        className,
      )}
    >
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Expand sidebar">
            <ChevronRightIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-sidebar border-sidebar-border h-full !max-w-64 border-r p-2">
          <SidebarContent setIsCollapsed={setIsCollapsed} hideCollapseButton />
        </DrawerContent>
      </Drawer>
    </aside>
  );
};
