export const sectionsMetadata = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "chats", label: "Chats" },
  { id: "extensions", label: "Extensions", fillHeight: true },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts" },
  { id: "performance", label: "Performance" },
  { id: "providers", label: "Providers" },
  { id: "about", label: "Help & Updates" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
