import { useNavigate } from "react-router";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

export function KbdRegistry() {
  // TODO: Disable this in prod
  const navigate = useNavigate();
  useKeyboardShortcut("openTests", () => {
    void navigate("/tests");
  });
  useKeyboardShortcut("openSettings", () => {
    void navigate("/settings");
  });
  useKeyboardShortcut("newChat", () => {
    void navigate("/chat");
  });

  return null;
}
