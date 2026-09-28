import { createElement } from "react";

import { getSectionComponent } from "./sections-config";

interface SettingsContentProps {
  activeSection: string;
}

export default function SettingsContent({ activeSection }: SettingsContentProps) {
  const SectionComponent = getSectionComponent(activeSection);

  if (!SectionComponent) {
    return <div>Select a section from the sidebar.</div>;
  }

  return <div className="flex flex-col gap-2">{createElement(SectionComponent)}</div>;
}
