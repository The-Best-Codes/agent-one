import { IconSettings } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";
import { Link } from "react-router";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useComputerUsePermissions } from "@/hooks/use-computer-use-permissions";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";
import { getMergedEnabledTools, getMergedToolConfigs } from "@/lib/settings/tools";
import type { ToolId } from "@/lib/settings/types";

import { ToolSettingsDialog } from "./tool-settings-dialog";
import { TOOL_SETS } from "./tools-metadata";

interface ToolSwitchProps {
  toolIds: ToolId[];
  label: string;
  disabledReason?: string | null;
}

function ToolAccessSwitch({ toolIds, label, disabledReason }: ToolSwitchProps) {
  const [enabledTools, setEnabledTools] = useAtom(settingAtoms.ENABLED_TOOLS);
  const merged = getMergedEnabledTools(enabledTools);
  const checked = toolIds.every((toolId) => merged[toolId]);

  const toggle = (
    <Switch
      checked={checked}
      disabled={!!disabledReason}
      onCheckedChange={(nextEnabled) => {
        setEnabledTools((prev) => ({
          ...prev,
          ...Object.fromEntries(toolIds.map((toolId) => [toolId, nextEnabled])),
        }));
      }}
      aria-label={label}
    />
  );

  if (!disabledReason) return toggle;

  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span>{toggle}</span>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent>{disabledReason}</AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}

function ToolApprovalSwitch({ toolIds, label }: ToolSwitchProps) {
  const [toolConfigs, setToolConfigs] = useAtom(settingAtoms.TOOL_CONFIGS);
  const merged = getMergedToolConfigs(toolConfigs);
  const checked = toolIds.some((toolId) => merged[toolId].requiresApproval);

  return (
    <Switch
      checked={checked}
      onCheckedChange={(requiresApproval) => {
        setToolConfigs((prev) => ({
          ...prev,
          ...Object.fromEntries(
            toolIds.map((toolId) => [
              toolId,
              { ...DEFAULT_SETTINGS.TOOL_CONFIGS[toolId], ...prev[toolId], requiresApproval },
            ]),
          ),
        }));
      }}
      aria-label={label}
    />
  );
}

interface ToolOptionsButtonProps {
  toolIds: ToolId[];
  title: string;
  description: string;
}

function ToolOptionsButton({ toolIds, title, description }: ToolOptionsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`${title} options`}
      >
        <IconSettings />
      </Button>
      <ToolSettingsDialog
        title={title}
        description={description}
        toolIds={toolIds}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export function MemoryToolToggle() {
  return <ToolAccessSwitch toolIds={TOOL_SETS.memory} label="Allow AgentOne to edit memories" />;
}

export function ChatHistoryToolToggle() {
  return (
    <>
      <ToolOptionsButton
        toolIds={TOOL_SETS.chatHistory}
        title="Past chats"
        description="How much AgentOne reads when it looks through your past chats."
      />
      <ToolAccessSwitch toolIds={TOOL_SETS.chatHistory} label="Allow AgentOne to read past chats" />
    </>
  );
}

export function SettingsToolToggle() {
  return (
    <ToolAccessSwitch toolIds={TOOL_SETS.settings} label="Allow AgentOne to change settings" />
  );
}

export function SettingsApprovalToggle() {
  return (
    <ToolApprovalSwitch toolIds={TOOL_SETS.settingsChanges} label="Ask before changing settings" />
  );
}

export function ScheduledAgentsToolToggle() {
  return (
    <ToolAccessSwitch
      toolIds={TOOL_SETS.scheduledAgents}
      label="Allow AgentOne to manage scheduled agents"
    />
  );
}

export function ScheduledAgentsApprovalToggle() {
  return (
    <ToolApprovalSwitch
      toolIds={TOOL_SETS.scheduledAgentChanges}
      label="Ask before changing scheduled agents"
    />
  );
}

export function OpenScheduledAgentsButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/scheduled-agents">Open</Link>
    </Button>
  );
}

export function WebToolToggle() {
  return (
    <>
      <ToolOptionsButton
        toolIds={TOOL_SETS.web}
        title="Web access"
        description="Limits for searching the web, reading pages, and Wikipedia."
      />
      <ToolAccessSwitch toolIds={TOOL_SETS.web} label="Allow web access" />
    </>
  );
}

export function ReadFilesToolToggle() {
  return (
    <>
      <ToolOptionsButton
        toolIds={TOOL_SETS.readFiles}
        title="Read files"
        description="How much of a file AgentOne reads at once."
      />
      <ToolAccessSwitch toolIds={TOOL_SETS.readFiles} label="Allow AgentOne to read files" />
    </>
  );
}

export function ChangeFilesToolToggle() {
  return (
    <ToolAccessSwitch toolIds={TOOL_SETS.changeFiles} label="Allow AgentOne to change files" />
  );
}

export function ChangeFilesApprovalToggle() {
  return <ToolApprovalSwitch toolIds={TOOL_SETS.changeFiles} label="Ask before changing files" />;
}

export function CommandsToolToggle() {
  return (
    <>
      <ToolOptionsButton
        toolIds={TOOL_SETS.commands}
        title="Run commands"
        description="Timeouts and output limits for terminal commands."
      />
      <ToolAccessSwitch toolIds={TOOL_SETS.commands} label="Allow AgentOne to run commands" />
    </>
  );
}

export function CommandsApprovalToggle() {
  return <ToolApprovalSwitch toolIds={TOOL_SETS.commands} label="Ask before running commands" />;
}

export function SubAgentsToolToggle() {
  return <ToolAccessSwitch toolIds={TOOL_SETS.subAgents} label="Allow AgentOne to use subagents" />;
}

const PERMISSION_NAMES = { accessibility: "Accessibility", screenRecording: "Screen Recording" };

function useMissingComputerUsePermissionsReason() {
  const { permissions } = useComputerUsePermissions();
  if (!permissions) return null;
  const missing = (Object.keys(PERMISSION_NAMES) as (keyof typeof PERMISSION_NAMES)[])
    .filter((permission) => !permissions[permission])
    .map((permission) => PERMISSION_NAMES[permission]);
  if (missing.length === 0) return null;
  return `Allow ${missing.join(" and ")} above first.`;
}

export function ComputerUseToolToggle() {
  const disabledReason = useMissingComputerUsePermissionsReason();
  return (
    <ToolAccessSwitch
      toolIds={TOOL_SETS.computerUse}
      label="Allow AgentOne to use apps"
      disabledReason={disabledReason}
    />
  );
}

export function ComputerUseApprovalToggle() {
  return <ToolApprovalSwitch toolIds={TOOL_SETS.computerUse} label="Ask before using apps" />;
}
