export const keyboardShortcutDefinitions = [
  { id: "focusMainChatInput", label: "Focus chat input", defaultShortcut: "ctrl+l" },
  { id: "openSettings", label: "Open settings", defaultShortcut: "ctrl+comma" },
  { id: "openTests", label: "Open tests", defaultShortcut: "ctrl+shift+q" },
  { id: "newChat", label: "New chat", defaultShortcut: "ctrl+n" },
  { id: "focusChatSearch", label: "Focus chat search", defaultShortcut: "ctrl+k" },
  {
    id: "focusChatSearchCollapsed",
    label: "Open chat search when sidebar is collapsed",
    defaultShortcut: "ctrl+k",
  },
  { id: "toggleSidebar", label: "Toggle sidebar", defaultShortcut: "ctrl+b" },
] as const;

export type KeyboardShortcutId = (typeof keyboardShortcutDefinitions)[number]["id"];

export interface KeyboardShortcutConfig {
  shortcut: string;
  enabledInInputs?: boolean;
  preventDefault: boolean;
}

export type KeyboardShortcutSettings = Record<KeyboardShortcutId, KeyboardShortcutConfig>;

export const defaultKeyboardShortcuts = Object.fromEntries(
  keyboardShortcutDefinitions.map((shortcut) => [
    shortcut.id,
    {
      shortcut: shortcut.defaultShortcut,
      preventDefault: true,
    },
  ]),
) as KeyboardShortcutSettings;

export const kbdRegistry = Object.fromEntries(
  keyboardShortcutDefinitions.map((shortcut) => [shortcut.id, shortcut.defaultShortcut]),
) as Record<KeyboardShortcutId, string>;
