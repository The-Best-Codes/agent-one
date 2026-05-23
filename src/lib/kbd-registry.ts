export const keyboardShortcutDefinitions = [
  {
    id: "focusMainChatInput",
    label: "Focus chat input",
    description: "Move the cursor to the message box.",
    defaultShortcut: "ctrl+l",
  },
  {
    id: "openSettings",
    label: "Open settings",
    description: "Jump directly to the settings screen.",
    defaultShortcut: "ctrl+comma",
  },
  {
    id: "openTests",
    label: "Open tests",
    description: "Open the internal tests screen.",
    defaultShortcut: "ctrl+shift+q",
  },
  {
    id: "newChat",
    label: "New chat",
    description: "Start a new conversation.",
    defaultShortcut: "ctrl+n",
  },
  {
    id: "focusChatSearch",
    label: "Focus chat search",
    description: "Search your chats from the sidebar.",
    defaultShortcut: "ctrl+k",
  },
  {
    id: "focusChatSearchCollapsed",
    label: "Open chat search when sidebar is collapsed",
    description: "Open chat search when the sidebar is hidden or compact.",
    defaultShortcut: "ctrl+k",
  },
  {
    id: "toggleSidebar",
    label: "Toggle sidebar",
    description: "Show or hide the chat sidebar.",
    defaultShortcut: "ctrl+b",
  },
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
