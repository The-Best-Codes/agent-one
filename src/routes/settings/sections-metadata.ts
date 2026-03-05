export const sectionsMetadata = [
  { id: "account", label: "Account" },
  { id: "providers", label: "Providers" },
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "messages", label: "Messages" },
  { id: "titles", label: "Titles" },
  { id: "mcp", label: "Extensions" },
  { id: "streaming", label: "Streaming" },
  { id: "about", label: "About" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
