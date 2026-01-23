import type { ComponentType } from "react";

import AboutSection from "./sections/about";
import AccountSection from "./sections/account";
import AppearanceSection from "./sections/appearance";
import EditorSection from "./sections/editor";
import McpSection from "./sections/mcp";
import MessagesSection from "./sections/messages";
import StreamingSection from "./sections/streaming";
import TitlesSection from "./sections/titles";
import ToolsSection from "./sections/tools";

interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
  component: ComponentType;
}

export const sections: SettingsSection[] = [
  { id: "account", label: "Account", component: AccountSection },
  { id: "appearance", label: "Appearance", component: AppearanceSection },
  { id: "editor", label: "Editor", component: EditorSection },
  { id: "messages", label: "Messages", component: MessagesSection },
  { id: "titles", label: "Titles", component: TitlesSection },
  { id: "tools", label: "Tools", component: ToolsSection },
  { id: "mcp", label: "MCP Servers", component: McpSection },
  { id: "streaming", label: "Streaming", component: StreamingSection },
  { id: "about", label: "About", component: AboutSection },
];

export const isValidSection = (section: string): boolean => {
  return sections.some((s) => s.id === section);
};

export const getSectionComponent = (
  sectionId: string,
): ComponentType | undefined => {
  return sections.find((s) => s.id === sectionId)?.component;
};
