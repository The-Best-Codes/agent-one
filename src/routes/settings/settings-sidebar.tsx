import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
}

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

const sections: SettingsSection[] = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "messages", label: "Messages" },
  { id: "tools", label: "Tools" },
  { id: "streaming", label: "Streaming" },
  { id: "about", label: "About" },
];

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
  className,
}: SettingsSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {sections.map((section) => {
        const isSelected = activeSection === section.id;

        return (
          <Button
            key={section.id}
            variant={isSelected ? "secondary" : "ghost"}
            className={cn(
              "justify-start text-left transition-none",
              isSelected && "border pl-[calc(1rem-1px)]",
            )}
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
