import { useNavigate } from "react-router";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

export function KbdRegistry() {
  const navigate = useNavigate();
  useKeyboardShortcut("openSettings", () => {
    void navigate("/settings");
  });
  useKeyboardShortcut("newChat", () => {
    void navigate("/chat");
  });

  return null;
}
