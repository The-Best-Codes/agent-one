import { useAtomValue } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";

import {
  keyboardShortcutsAtom,
  keyboardShortcutsEnabledInInputsAtom,
} from "@/lib/jotai/settings-atoms";
import type { KeyboardShortcutId } from "@/lib/kbd-registry";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

export function useKeyboardShortcut(id: KeyboardShortcutId, callback: () => void) {
  const shortcuts = useAtomValue(keyboardShortcutsAtom);
  const enabledInInputsDefault = useAtomValue(keyboardShortcutsEnabledInInputsAtom);
  const config = shortcuts[id] ?? DEFAULT_SETTINGS.KEYBOARD_SHORTCUTS[id];
  const enableOnFormTags = config.enabledInInputs ?? enabledInInputsDefault;

  useHotkeys(config.shortcut, callback, {
    enabled: Boolean(config.shortcut),
    enableOnFormTags,
    preventDefault: config.preventDefault,
  });
}
