import { IconRestore, IconSettings } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { memo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { enabledToolsAtom, toolConfigsAtom } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

import SettingsTarget from "../../settings-target";
import { ToolSettingsDialog } from "./tool-settings-dialog";
import { TOOL_INFO, getMergedToolConfigs } from "./tools-metadata";

interface ToolRowProps {
  toolId: ToolId;
}

export const ToolRow = memo(function ToolRow({ toolId }: ToolRowProps) {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [toolConfigs, setToolConfigs] = useAtom(toolConfigsAtom);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const tool = TOOL_INFO[toolId];
  const enabled = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools }[toolId];
  const mergedToolConfigs = getMergedToolConfigs(toolConfigs);

  const updateToolEnabled = (nextEnabled: boolean) => {
    setEnabledTools((prev) => ({ ...prev, [toolId]: nextEnabled }));
  };

  const updateToolConfig = <T extends ToolId>(id: T, updates: Partial<ToolConfigs[T]>) => {
    setToolConfigs((prev) => ({
      ...prev,
      [id]: { ...DEFAULT_SETTINGS.TOOL_CONFIGS[id], ...prev[id], ...updates },
    }));
  };

  const resetTool = () => {
    setEnabledTools((prev) => ({ ...prev, [toolId]: DEFAULT_SETTINGS.ENABLED_TOOLS[toolId] }));
    setToolConfigs((prev) => ({ ...prev, [toolId]: { ...DEFAULT_SETTINGS.TOOL_CONFIGS[toolId] } }));
  };

  const isToolDefault =
    enabled === DEFAULT_SETTINGS.ENABLED_TOOLS[toolId] &&
    JSON.stringify(mergedToolConfigs[toolId]) ===
      JSON.stringify(DEFAULT_SETTINGS.TOOL_CONFIGS[toolId]);

  return (
    <SettingsTarget id={`setting-tool-${tool.anchor}`}>
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col items-start">
          <Label htmlFor={`enabled-${toolId}`} className="text-sm font-medium">
            {tool.name}
          </Label>
          <p className="text-muted-foreground mt-1 text-sm">{tool.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id={`enabled-${toolId}`}
            checked={enabled}
            onCheckedChange={updateToolEnabled}
            aria-label={`Enable ${tool.name}`}
          />

          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => {
                setIsSettingsOpen(true);
              }}
              aria-label={`Configure ${tool.name}`}
            >
              <IconSettings />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetTool}
              disabled={isToolDefault}
              aria-label={`Reset ${tool.name}`}
            >
              <IconRestore />
            </Button>
          </div>
        </div>
      </div>

      <ToolSettingsDialog
        toolId={toolId}
        configs={mergedToolConfigs}
        onConfigChange={updateToolConfig}
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </SettingsTarget>
  );
});
