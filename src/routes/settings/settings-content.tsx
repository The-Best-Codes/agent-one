import { createElement } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { getSectionComponent } from "./sections-config";

interface SettingsContentProps {
  activeSection: string;
  fillHeight?: boolean;
}

export default function SettingsContent({ activeSection, fillHeight }: SettingsContentProps) {
  const { t } = useTranslation();
  const SectionComponent = getSectionComponent(activeSection);

  if (!SectionComponent) {
    return <div>{t("settings.selectSection")}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-2", fillHeight && "min-h-0 min-w-0 flex-1")}>
      {createElement(SectionComponent)}
    </div>
  );
}
