import type { ComponentType } from "react";

import { settingsSections, type SettingsSectionId } from "@/lib/settings/registry";

import AboutSection from "./renderers/about";
import AccountSection from "./renderers/account";
import AppearanceSection from "./renderers/appearance";
import ChatsSection from "./renderers/chats";
import KeyboardShortcutsSection from "./renderers/keyboard-shortcuts";
import PerformanceSection from "./renderers/performance";
import ExtensionsSection from "./sections/extensions";
import { ProvidersList as ProvidersSection } from "./sections/providers/providers-list";

type SectionRenderer = ComponentType<{ cardIndex?: number }>;
type RendererId = (typeof settingsSections)[number]["renderer"];

const sectionComponents: Record<RendererId, SectionRenderer> = {
  account: AccountSection,
  appearance: AppearanceSection,
  chats: ChatsSection,
  extensions: ExtensionsSection,
  "keyboard-shortcuts": KeyboardShortcutsSection,
  providers: ProvidersSection,
  performance: PerformanceSection,
  about: AboutSection,
};

export const sections: Array<{
  id: SettingsSectionId;
  label: string;
  fillHeight?: boolean;
  requiresDebugMode?: boolean;
  component: ComponentType;
}> = settingsSections.map((section) => ({
  ...section,
  component: () => {
    const Component = sectionComponents[section.renderer];
    const cardIndex = "cardIndex" in section ? section.cardIndex : undefined;
    return <Component cardIndex={cardIndex} />;
  },
}));

const legacySectionIds: Record<string, SettingsSectionId> = {
  performance: "rendering-limits",
  about: "app-updates",
};

export function resolveSettingsSection(section: string): SettingsSectionId | undefined {
  return (
    settingsSections.find((candidate) => candidate.id === section)?.id ?? legacySectionIds[section]
  );
}

export function isValidSection(section: string): section is SettingsSectionId {
  return resolveSettingsSection(section) !== undefined;
}

export function getSectionComponent(section: string): ComponentType | undefined {
  const resolvedSection = resolveSettingsSection(section);
  return sections.find((candidate) => candidate.id === resolvedSection)?.component;
}
