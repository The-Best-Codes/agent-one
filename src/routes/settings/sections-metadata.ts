export const sectionsMetadata = [
  { id: "account", labelKey: "settings.sections.account" },
  { id: "appearance", labelKey: "settings.sections.appearance" },
  { id: "chats", labelKey: "settings.sections.chats" },
  { id: "extensions", labelKey: "settings.sections.extensions", fillHeight: true },
  { id: "keyboard-shortcuts", labelKey: "settings.sections.keyboard-shortcuts" },
  { id: "performance", labelKey: "settings.sections.performance" },
  { id: "providers", labelKey: "settings.sections.providers" },
  { id: "about", labelKey: "settings.sections.about" },
] as const;

export type SectionId = (typeof sectionsMetadata)[number]["id"];
