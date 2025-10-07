import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";

import { kbdRegistry } from "@/lib/kbd-registry";

export function KbdRegistry() {
  // TODO: Disable this in prod
  const navigate = useNavigate();
  useHotkeys(kbdRegistry.openTests, () => {
    navigate("/tests");
  });
  useHotkeys(kbdRegistry.openSettings, () => {
    navigate("/settings");
  });

  return null;
}
