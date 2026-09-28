export const sectionsMetadata = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "chats", label: "Chats" },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts" },
  { id: "performance", label: "Performance" },
  { id: "providers", label: "Providers" },
  { id: "tools", label: "Tools" },
  { id: "about", label: "Help & Updates" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
