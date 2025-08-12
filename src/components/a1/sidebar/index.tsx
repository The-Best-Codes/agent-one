import { ModelSelector } from "@/components/a1/model-selector";
import ThemeSelect from "@/components/theme/select-menu";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { ChatList } from "./chat-list";

interface SidebarProps {
  className?: string;
}

const SidebarContent = ({
  setIsCollapsed,
}: {
  setIsCollapsed: (value: boolean) => void;
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        <ChatList />
      </div>

      <div className="p-2 border-t border-sidebar-border flex flex-col justify-center gap-2">
        <ModelSelector
          className="w-full"
          popoverClassName="w-[calc(var(--radix-popover-trigger-width)-1rem)]"
        />
        <ThemeSelect className="w-full" />
        <Button
          variant="outline"
          onClick={() => setIsCollapsed(true)}
          className="w-full"
        >
          <ChevronLeftIcon />
        </Button>
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
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col",
          isCollapsed ? "w-12 items-center" : "w-64",
          className,
        )}
      >
        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center mt-1.5">
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
        "w-12 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center",
        className,
      )}
    >
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button
            className="mt-1.5"
            variant="outline"
            size="icon"
            aria-label="Expand sidebar"
          >
            <ChevronRightIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-64 h-full p-0 bg-sidebar border-r border-sidebar-border">
          <SidebarContent setIsCollapsed={setIsCollapsed} />
        </DrawerContent>
      </Drawer>
    </aside>
  );
};
