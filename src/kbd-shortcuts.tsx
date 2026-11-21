import { useLocation, useNavigate } from "react-router";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

export function KbdRegistry() {
  const navigate = useNavigate();
  const location = useLocation();
  useKeyboardShortcut("openSettings", () => {
    if (location.pathname === "/settings") return;
    void navigate("/settings");
  });
  useKeyboardShortcut("newChat", () => {
    void navigate("/chat");
  });

  return null;
}
