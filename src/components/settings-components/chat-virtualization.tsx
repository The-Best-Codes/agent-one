import { useAtom } from "jotai";

import { Switch } from "@/components/ui/switch";
import { settingAtoms } from "@/lib/jotai/settings-atoms";

export function VirtualizationControl() {
  const [mode, setMode] = useAtom(settingAtoms.CHAT_VIRTUALIZATION_MODE);

  return (
    <Switch
      checked={mode !== "off"}
      onCheckedChange={(checked) => setMode(checked ? "threshold" : "off")}
      aria-label="Virtualize chat messages"
    />
  );
}
