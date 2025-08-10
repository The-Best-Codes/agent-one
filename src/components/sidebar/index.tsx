import { ModelSelector } from "@/components/a1/model-selector";
import ThemeSelect from "@/components/theme/select-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col",
        className,
      )}
    >
      <div className="flex-1 p-4 space-y-2">
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
    </aside>
  );
};
