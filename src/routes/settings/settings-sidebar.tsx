import { useAtomValue } from "jotai";
import { Fragment, useMemo } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { debugModeEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";
import { isSectionVisible, sections } from "@/lib/settings/registry";
import { cn } from "@/lib/utils";

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
  const debugModeEnabled = useAtomValue(debugModeEnabledAtom);

  const visibleSections = useMemo(
    () => sections.filter((section) => isSectionVisible(section.id, debugModeEnabled)),
    [debugModeEnabled],
  );

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
      {visibleSections.map((section, index) => {
        const heading =
          section.group && section.group !== visibleSections[index - 1]?.group
            ? section.group
            : undefined;

        return (
          <Fragment key={section.id}>
            {heading && (
              <p
                role="presentation"
                className="text-muted-foreground w-full flex-none px-4 pt-3 pb-1 text-xs font-medium"
              >
                {heading}
              </p>
            )}
            <ToggleGroupItem
              value={section.id}
              role="tab"
              aria-selected={activeSection === section.id}
              aria-checked={undefined}
              className="data-[state=on]:bg-input w-full flex-none justify-start rounded-md border-0 px-4 text-left shadow-none transition-none"
            >
              {section.label}
            </ToggleGroupItem>
          </Fragment>
        );
      })}
    </ToggleGroup>
  );
}
