export const sectionsMetadata = [
  { id: "account", label: "Account" },
  { id: "providers", label: "Providers" },
  { id: "chats", label: "Chats" },
  { id: "performance", label: "Performance" },
  { id: "appearance", label: "Appearance" },
  { id: "extensions", label: "Extensions" },
  { id: "streaming", label: "Streaming" },
  { id: "about", label: "Help & Updates" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
