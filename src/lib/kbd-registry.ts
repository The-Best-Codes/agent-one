export const keyboardShortcutDefinitions = [
  {
    id: "focusMainChatInput",
    labelKey: "shortcuts.focusMainChatInput.label",
    descriptionKey: "shortcuts.focusMainChatInput.description",
    defaultShortcut: "ctrl+l",
  },
  {
    id: "openSettings",
    labelKey: "shortcuts.openSettings.label",
    descriptionKey: "shortcuts.openSettings.description",
    defaultShortcut: "ctrl+comma",
  },
  {
    id: "newChat",
    labelKey: "shortcuts.newChat.label",
    descriptionKey: "shortcuts.newChat.description",
    defaultShortcut: "ctrl+n",
  },
  {
    id: "focusChatSearch",
    labelKey: "shortcuts.focusChatSearch.label",
    descriptionKey: "shortcuts.focusChatSearch.description",
    defaultShortcut: "ctrl+k",
  },
  {
    id: "focusChatSearchCollapsed",
    labelKey: "shortcuts.focusChatSearchCollapsed.label",
    descriptionKey: "shortcuts.focusChatSearchCollapsed.description",
    defaultShortcut: "ctrl+k",
  },
  {
    id: "toggleSidebar",
    labelKey: "shortcuts.toggleSidebar.label",
    descriptionKey: "shortcuts.toggleSidebar.description",
    defaultShortcut: "ctrl+b",
  },
  {
    id: "stopResponse",
    labelKey: "shortcuts.stopResponse.label",
    descriptionKey: "shortcuts.stopResponse.description",
    defaultShortcut: "shift+esc",
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
