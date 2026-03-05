import type { ComponentType } from "react";

import AboutSection from "./sections/about";
import AccountSection from "./sections/account";
import AppearanceSection from "./sections/appearance";
import EditorSection from "./sections/editor";
import McpSection from "./sections/mcp";
import MessagesSection from "./sections/messages";
import ProvidersSection from "./sections/providers";
import StreamingSection from "./sections/streaming";
import TitlesSection from "./sections/titles";
import { type SectionId, sectionsMetadata } from "./sections-metadata";

interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  component: ComponentType;
}

const componentMap: Record<SectionId, ComponentType> = {
  account: AccountSection,
  providers: ProvidersSection,
  appearance: AppearanceSection,
  editor: EditorSection,
  messages: MessagesSection,
  titles: TitlesSection,
  mcp: McpSection,
  streaming: StreamingSection,
  about: AboutSection,
};

export const sections: SettingsSection[] = sectionsMetadata.map((meta) => ({
  ...meta,
  component: componentMap[meta.id],
}));

export const isValidSection = (section: string): boolean => {
  return sections.some((s) => s.id === section);
};

export const getSectionComponent = (
  sectionId: string,
): ComponentType | undefined => {
  return sections.find((s) => s.id === sectionId)?.component;
};
