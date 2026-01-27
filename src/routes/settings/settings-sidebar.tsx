import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { sections } from "./sections-config";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
  className,
}: SettingsSidebarProps) {
  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      role="tablist"
      aria-orientation="vertical"
    >
      {sections.map((section) => {
        const isSelected = activeSection === section.id;

        return (
          <Button
            key={section.id}
            variant={isSelected ? "secondary" : "ghost"}
            className={cn(
              "justify-start text-left transition-none",
              isSelected && "border pl-3.75",
            )}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </Button>
        );
      })}
    </div>
  );
}
