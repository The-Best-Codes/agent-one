import type { ComponentType } from "react";

import { type SectionId, sectionsMetadata } from "./sections-metadata";
import AboutSection from "./sections/about";
import AccountSection from "./sections/account";
import AppearanceSection from "./sections/appearance";
import ChatsSection from "./sections/chats";
import ExtensionsSection from "./sections/extensions";
import KeyboardShortcutsSection from "./sections/keyboard-shortcuts";
import PerformanceSection from "./sections/performance";
import ProvidersSection from "./sections/providers";

interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  component: ComponentType;
}

const componentMap: Record<SectionId, ComponentType> = {
  account: AccountSection,
  providers: ProvidersSection,
  chats: ChatsSection,
  performance: PerformanceSection,
  appearance: AppearanceSection,
  extensions: ExtensionsSection,
  "keyboard-shortcuts": KeyboardShortcutsSection,
  about: AboutSection,
};

export const sections: SettingsSection[] = sectionsMetadata.map((meta) => ({
  ...meta,
  component: componentMap[meta.id],
}));

export const isValidSection = (section: string): boolean => {
  return sections.some((s) => s.id === section);
};

export const getSectionComponent = (sectionId: string): ComponentType | undefined => {
  return sections.find((s) => s.id === sectionId)?.component;
};
