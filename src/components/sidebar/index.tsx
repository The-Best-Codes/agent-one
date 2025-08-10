import { ModelSelector } from "@/components/a1/model-selector";
import ThemeSelect from "@/components/theme/select-menu";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

const SidebarContent = () => (
  <div className="flex-1 p-2 space-y-2">
    <div className="space-y-2">
      <label className="text-sm font-medium text-sidebar-foreground">
        Model
      </label>
      <ModelSelector className="w-60" popoverClassName="w-60" />
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium text-sidebar-foreground">
        Theme
      </label>
      <ThemeSelect className="w-60" />
    </div>
  </div>
);

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
          <div className="flex-1 flex flex-col items-center">
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
            <SidebarContent />
            <div className="p-2 border-t border-sidebar-border mt-auto">
              <Button
                variant="outline"
                onClick={() => setIsCollapsed(true)}
                className="w-full"
              >
                <ChevronLeftIcon />
                Collapse
              </Button>
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
          <Button variant="outline" size="icon" aria-label="Expand sidebar">
            <ChevronRightIcon />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-64 h-full p-0 bg-sidebar border-r border-sidebar-border">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </DrawerContent>
      </Drawer>
    </aside>
  );
};
