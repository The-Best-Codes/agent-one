import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";

import { kbdRegistry } from "@/lib/kbd-registry";

export function KbdRegistry() {
  // TODO: Disable this in prod
  const navigate = useNavigate();
  useHotkeys(kbdRegistry.openTests, () => {
    void navigate("/tests");
  });
  useHotkeys(kbdRegistry.openSettings, () => {
    void navigate("/settings");
  });
  useHotkeys(kbdRegistry.newChat, () => {
    void navigate("/chat");
  });

  return null;
}
