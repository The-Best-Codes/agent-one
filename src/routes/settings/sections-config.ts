interface SettingsSection {
  id: string;
  label: string;
  icon?: string;
}

export const sections: SettingsSection[] = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "messages", label: "Messages" },
  { id: "titles", label: "Titles" },
  { id: "tools", label: "Tools" },
  { id: "mcp", label: "MCP Servers" },
  { id: "streaming", label: "Streaming" },
  { id: "about", label: "About" },
];

export const isValidSection = (section: string): boolean => {
  return sections.some((s) => s.id === section);
};
