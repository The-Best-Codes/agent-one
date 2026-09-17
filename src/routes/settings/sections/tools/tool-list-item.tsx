import { useAtom } from "jotai";
import { memo } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { enabledToolsAtom, toolConfigsAtom } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

import { BUILT_IN_TOOLS, getMergedToolConfigs } from "./tools-metadata";

function ToolToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ToolNumberField({
  id,
  label,
  value,
  min,
  max,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  fallback: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const parsed = parseInt(event.target.value) || fallback;
          onChange(Math.max(min, Math.min(parsed, max)));
        }}
      />
    </Field>
  );
}

interface ToolListItemProps {
  toolId: ToolId;
}

export const ToolListItem = memo(function ToolListItem({ toolId }: ToolListItemProps) {
  const [enabledTools, setEnabledTools] = useAtom(enabledToolsAtom);
  const [toolConfigs, setToolConfigs] = useAtom(toolConfigsAtom);

  const tool = BUILT_IN_TOOLS[toolId];
  const enabled = { ...DEFAULT_SETTINGS.ENABLED_TOOLS, ...enabledTools }[toolId];
  const mergedToolConfigs = getMergedToolConfigs(toolConfigs);
  const ToolIcon = tool.icon;

  const updateToolEnabled = (nextEnabled: boolean) => {
    trackSettingsInteraction("tools", "tool_toggled", {
      tool_id: toolId,
      enabled: nextEnabled,
    });
    setEnabledTools((prev) => ({ ...prev, [toolId]: nextEnabled }));
  };

  const updateToolConfig = <T extends ToolId>(id: T, updates: Partial<ToolConfigs[T]>) => {
    trackSettingsInteraction("tools", "tool_config_changed", {
      tool_id: id,
    });
    setToolConfigs((prev) => ({
      ...prev,
      [id]: { ...DEFAULT_SETTINGS.TOOL_CONFIGS[id], ...prev[id], ...updates },
    }));
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border p-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <ToolIcon className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`enabled-${toolId}`} className="text-sm font-medium">
              {tool.name}
            </Label>
            <p className="text-muted-foreground text-sm">{tool.description}</p>
          </div>
        </div>
        <Switch
          id={`enabled-${toolId}`}
          checked={enabled}
          onCheckedChange={updateToolEnabled}
          aria-label={`Enable ${tool.name}`}
        />
      </div>

      {enabled ? (
        <div className="flex flex-col gap-4 border-t pt-4">
          <ToolToggleRow
            id={`approval-${toolId}`}
            label="Require Approval"
            description="Ask for confirmation before running this tool"
            checked={mergedToolConfigs[toolId].requiresApproval}
            onChange={(requiresApproval) => updateToolConfig(toolId, { requiresApproval })}
          />

          {toolId === "dateTime" ? (
            <ToolToggleRow
              id="dateTime-utc"
              label="Use UTC"
              description="Return time in UTC instead of your local timezone"
              checked={mergedToolConfigs.dateTime.useUtc}
              onChange={(useUtc) => updateToolConfig("dateTime", { useUtc })}
            />
          ) : null}

          {toolId === "waitNumberMilliseconds" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ToolNumberField
                id="wait-min"
                label="Min Duration (ms)"
                value={mergedToolConfigs.waitNumberMilliseconds.minMs}
                min={0}
                max={mergedToolConfigs.waitNumberMilliseconds.maxMs}
                fallback={0}
                onChange={(minMs) => updateToolConfig("waitNumberMilliseconds", { minMs })}
              />
              <ToolNumberField
                id="wait-max"
                label="Max Duration (ms)"
                value={mergedToolConfigs.waitNumberMilliseconds.maxMs}
                min={mergedToolConfigs.waitNumberMilliseconds.minMs}
                max={600000}
                fallback={60000}
                onChange={(maxMs) => updateToolConfig("waitNumberMilliseconds", { maxMs })}
              />
            </div>
          ) : null}

          {toolId === "getUrlContent" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ToolNumberField
                  id="url-min"
                  label="Min URLs"
                  value={mergedToolConfigs.getUrlContent.minUrls}
                  min={1}
                  max={mergedToolConfigs.getUrlContent.maxUrls}
                  fallback={1}
                  onChange={(minUrls) => updateToolConfig("getUrlContent", { minUrls })}
                />
                <ToolNumberField
                  id="url-max"
                  label="Max URLs"
                  value={mergedToolConfigs.getUrlContent.maxUrls}
                  min={mergedToolConfigs.getUrlContent.minUrls}
                  max={200}
                  fallback={5}
                  onChange={(maxUrls) => updateToolConfig("getUrlContent", { maxUrls })}
                />
              </div>
              <ToolNumberField
                id="url-maxlength"
                label="Default Max Content Length"
                value={mergedToolConfigs.getUrlContent.defaultMaxLength}
                min={100}
                max={50000}
                fallback={1000}
                onChange={(defaultMaxLength) =>
                  updateToolConfig("getUrlContent", { defaultMaxLength })
                }
              />
            </>
          ) : null}

          {toolId === "webSearch" ? (
            <>
              <ToolNumberField
                id="search-concurrent"
                label="Max Concurrent Searches"
                value={mergedToolConfigs.webSearch.maxConcurrent}
                min={1}
                max={50}
                fallback={3}
                onChange={(maxConcurrent) => updateToolConfig("webSearch", { maxConcurrent })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ToolNumberField
                  id="search-results"
                  label="Default Max Results"
                  value={mergedToolConfigs.webSearch.defaultMaxResults}
                  min={1}
                  max={200}
                  fallback={20}
                  onChange={(defaultMaxResults) =>
                    updateToolConfig("webSearch", { defaultMaxResults })
                  }
                />
                <ToolNumberField
                  id="search-pages"
                  label="Default Max Pages"
                  value={mergedToolConfigs.webSearch.defaultMaxPages}
                  min={1}
                  max={20}
                  fallback={1}
                  onChange={(defaultMaxPages) => updateToolConfig("webSearch", { defaultMaxPages })}
                />
              </div>
            </>
          ) : null}

          {toolId === "wikipedia" ? (
            <ToolNumberField
              id="wikipedia-maxresults"
              label="Default Max Results"
              value={mergedToolConfigs.wikipedia.defaultMaxResults}
              min={1}
              max={50}
              fallback={10}
              onChange={(defaultMaxResults) => updateToolConfig("wikipedia", { defaultMaxResults })}
            />
          ) : null}

          {toolId === "viewFile" ? (
            <ToolNumberField
              id="viewFile-maxchars"
              label="Default Max Characters"
              value={mergedToolConfigs.viewFile.defaultMaxChars}
              min={100}
              max={100000}
              fallback={10000}
              onChange={(defaultMaxChars) => updateToolConfig("viewFile", { defaultMaxChars })}
            />
          ) : null}

          {toolId === "executeCommand" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ToolNumberField
                id="executeCommand-timeout"
                label="Default Timeout (ms)"
                value={mergedToolConfigs.executeCommand.defaultTimeoutMs}
                min={1000}
                max={600000}
                fallback={120000}
                onChange={(defaultTimeoutMs) =>
                  updateToolConfig("executeCommand", { defaultTimeoutMs })
                }
              />
              <ToolNumberField
                id="executeCommand-scrollback"
                label="Max Scrollback (chars)"
                value={mergedToolConfigs.executeCommand.maxScrollbackChars}
                min={1000}
                max={500000}
                fallback={25000}
                onChange={(maxScrollbackChars) =>
                  updateToolConfig("executeCommand", { maxScrollbackChars })
                }
              />
            </div>
          ) : null}

          {toolId === "subAgent" ? (
            <p className="text-muted-foreground text-sm">
              Subagents inherit the current model and enabled tools, but cannot spawn other
              subagents.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
