import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const { t } = useTranslation();

  return (
    <ToggleGroup
      type="single"
      value={activeSection}
      onValueChange={(value) => {
        if (value) {
          onSectionChange(value);
        }
      }}
      orientation="vertical"
      className={cn("flex w-full flex-col gap-0 bg-background border border-border", className)}
      role="tablist"
      aria-orientation="vertical"
    >
      {sections.map((section) => (
        <ToggleGroupItem
          key={section.id}
          value={section.id}
          role="tab"
          aria-selected={activeSection === section.id}
          aria-checked={undefined}
          className="data-[state=on]:bg-input w-full flex-none justify-start rounded-md border-0 px-4 text-left shadow-none transition-none"
        >
          {t(section.labelKey)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
