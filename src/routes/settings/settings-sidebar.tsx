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
      {sections.map((section) => (
        <Button
          key={section.id}
          variant={activeSection === section.id ? "secondary" : "ghost"}
          className="justify-start text-left"
          onClick={() => onSectionChange(section.id)}
        >
          {section.label}
        </Button>
      ))}
    </div>
  );
}
