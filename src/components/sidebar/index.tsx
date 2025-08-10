import { useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ModelSelector } from "@/components/a1/model-selector";
import ThemeSelect from "@/components/theme/select-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

const SidebarContent = () => (
  <div className="flex-1 p-4 space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium text-sidebar-foreground">
        Model
      </label>
      <ModelSelector className="w-full" popoverClassName="w-56" />
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium text-sidebar-foreground">
        Theme
      </label>
      <ThemeSelect className="w-full" />
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
          "h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16 items-center" : "w-64",
          className,
        )}
      >
        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <>
            <SidebarContent />
            <div className="p-4 border-t border-sidebar-border mt-auto">
              <Button
                variant="ghost"
                onClick={() => setIsCollapsed(true)}
                className="w-full justify-start px-2"
              >
                <ChevronsLeft className="h-5 w-5 mr-2" />
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
        "w-16 h-full bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4",
        className,
      )}
    >
      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Expand sidebar">
            <ChevronsRight className="h-5 w-5" />
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
