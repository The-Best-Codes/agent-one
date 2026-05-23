import { useAtomValue } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import {
  keyboardShortcutsAtom,
  keyboardShortcutsEnabledInInputsAtom,
} from "@/lib/jotai/settings-atoms";
import type { KeyboardShortcutId } from "@/lib/kbd-registry";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], .cm-editor"));
}

export function useKeyboardShortcut(id: KeyboardShortcutId, callback: () => void) {
  const shortcuts = useAtomValue(keyboardShortcutsAtom);
  const enabledInInputsDefault = useAtomValue(keyboardShortcutsEnabledInInputsAtom);
  const config = shortcuts[id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[id];
  const enableOnFormTags = config.enabledInInputs ?? enabledInInputsDefault;

  useHotkeys(
    config.shortcut,
    (event) => {
      if (!enableOnFormTags && isTypingTarget(event.target)) return;
      callback();
    },
    {
      enabled: Boolean(config.shortcut),
      enableOnContentEditable: enableOnFormTags,
      enableOnFormTags,
      preventDefault: config.preventDefault,
    },
  );
}
