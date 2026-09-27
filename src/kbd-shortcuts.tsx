import { useNavigate } from "react-router";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useSettingsPath } from "@/hooks/use-settings-path";

export function KbdRegistry() {
  const navigate = useNavigate();
  const settingsPath = useSettingsPath();
  useKeyboardShortcut("openSettings", () => {
    void navigate(settingsPath);
  });
  useKeyboardShortcut("newChat", () => {
    void navigate("/chat");
  });

  return null;
}
