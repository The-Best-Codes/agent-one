import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";

export function KbdRegistry() {
  // TODO: Disable this in prod
  const navigate = useNavigate();
  useHotkeys("ctrl+shift+q", () => {
    navigate("/tests");
  });

  return null;
}
