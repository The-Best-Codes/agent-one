import type { ComponentType } from "react";

import { settingsSections, type SettingsSectionId } from "@/lib/settings/registry";

import AboutSection from "./sections/about";
import AccountSection from "./sections/account";
import AppearanceSection from "./sections/appearance";
import ChatsSection from "./sections/chats";
import ExtensionsSection from "./sections/extensions";
import KeyboardShortcutsSection from "./sections/keyboard-shortcuts";
import PerformanceSection from "./sections/performance";
import ProvidersSection from "./sections/providers";

const sectionComponents: Record<SettingsSectionId, ComponentType> = {
  account: AccountSection,
  appearance: AppearanceSection,
  chats: ChatsSection,
  extensions: ExtensionsSection,
  "keyboard-shortcuts": KeyboardShortcutsSection,
  performance: PerformanceSection,
  providers: ProvidersSection,
  about: AboutSection,
};

export const sections: Array<{
  id: SettingsSectionId;
  label: string;
  fillHeight?: boolean;
  component: ComponentType;
}> = settingsSections.map((section) => ({
  ...section,
  component: sectionComponents[section.id],
}));

export function isValidSection(section: string): section is SettingsSectionId {
  return settingsSections.some((candidate) => candidate.id === section);
}

export function getSectionComponent(section: string): ComponentType | undefined {
  return sections.find((candidate) => candidate.id === section)?.component;
}
