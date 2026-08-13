import { createElement } from "react";

import { cn } from "@/lib/utils";

import { getSectionComponent } from "./sections-config";

interface SettingsContentProps {
  activeSection: string;
  fillHeight?: boolean;
}

export default function SettingsContent({ activeSection, fillHeight }: SettingsContentProps) {
  const SectionComponent = getSectionComponent(activeSection);

  if (!SectionComponent) {
    return <div>Select a section from the sidebar.</div>;
  }

  return (
    <div className={cn("flex flex-col gap-2", fillHeight && "min-h-0 min-w-0 flex-1")}>
      {createElement(SectionComponent)}
    </div>
  );
}
