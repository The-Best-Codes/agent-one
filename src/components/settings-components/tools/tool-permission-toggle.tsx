import { useAtom } from "jotai";

import { Switch } from "@/components/ui/switch";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";
import type { ToolId } from "@/lib/settings/types";

interface ToolPermissionToggleProps {
  toolIds: ToolId[];
  label: string;
}

export function ToolPermissionToggle({ toolIds, label }: ToolPermissionToggleProps) {
  const [enabledTools, setEnabledTools] = useAtom(settingAtoms.ENABLED_TOOLS);
  const merged = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools };
  const checked = toolIds.every((toolId) => merged[toolId]);

  return (
    <Switch
      checked={checked}
      onCheckedChange={(nextEnabled) => {
        setEnabledTools((prev) => ({
          ...prev,
          ...Object.fromEntries(toolIds.map((toolId) => [toolId, nextEnabled])),
        }));
      }}
      aria-label={label}
    />
  );
}

export function MemoryToolToggle() {
  return <ToolPermissionToggle toolIds={["memory"]} label="Allow AgentOne to edit memories" />;
}

export function ChatHistoryToolToggle() {
  return (
    <ToolPermissionToggle
      toolIds={["searchChats", "readChat"]}
      label="Allow AgentOne to read past chats"
    />
  );
}
