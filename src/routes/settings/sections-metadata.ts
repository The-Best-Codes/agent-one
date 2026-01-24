export const sectionsMetadata = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "messages", label: "Messages" },
  { id: "titles", label: "Titles" },
  { id: "tools", label: "Tools" },
  { id: "mcp", label: "MCP Servers" },
  { id: "streaming", label: "Streaming" },
  { id: "about", label: "About" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
