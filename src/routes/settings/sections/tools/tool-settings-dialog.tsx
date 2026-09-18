import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_SETTINGS, type ToolConfigs, type ToolId } from "@/lib/settings/types";

import { TOOL_INFO } from "./tools-metadata";

const defaults = DEFAULT_SETTINGS.TOOL_CONFIGS;

interface ToolSwitchFieldProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToolSwitchField({ id, label, description, checked, onChange }: ToolSwitchFieldProps) {
  return (
    <Field orientation="horizontal">
      <div className="flex flex-1 flex-col gap-0.5 leading-snug">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Field>
  );
}

interface ToolNumberFieldProps {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  fallback: number;
  onChange: (value: number) => void;
}

function ToolNumberField({
  id,
  label,
  description,
  value,
  min,
  max,
  fallback,
  onChange,
}: ToolNumberFieldProps) {
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
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

interface ToolSettingsDialogProps {
  toolId: ToolId;
  configs: ToolConfigs;
  onConfigChange: <T extends ToolId>(toolId: T, updates: Partial<ToolConfigs[T]>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolSettingsDialog({
  toolId,
  configs,
  onConfigChange,
  open,
  onOpenChange,
}: ToolSettingsDialogProps) {
  const tool = TOOL_INFO[toolId];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tool.name}</DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <ToolSwitchField
            id={`approval-${toolId}`}
            label="Require Approval"
            description="Ask for confirmation before running this tool"
            checked={configs[toolId].requiresApproval}
            onChange={(requiresApproval) => onConfigChange(toolId, { requiresApproval })}
          />

          {toolId === "dateTime" ? (
            <ToolSwitchField
              id="dateTime-utc"
              label="Use UTC"
              description="Return the time in UTC instead of your local timezone"
              checked={configs.dateTime.useUtc}
              onChange={(useUtc) => onConfigChange("dateTime", { useUtc })}
            />
          ) : null}

          {toolId === "waitNumberMilliseconds" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ToolNumberField
                id="wait-min"
                label="Min Duration (ms)"
                description="Shortest pause AgentOne may use."
                value={configs.waitNumberMilliseconds.minMs}
                min={0}
                max={configs.waitNumberMilliseconds.maxMs}
                fallback={defaults.waitNumberMilliseconds.minMs}
                onChange={(minMs) => onConfigChange("waitNumberMilliseconds", { minMs })}
              />
              <ToolNumberField
                id="wait-max"
                label="Max Duration (ms)"
                description="Longest pause AgentOne may use."
                value={configs.waitNumberMilliseconds.maxMs}
                min={configs.waitNumberMilliseconds.minMs}
                max={600000}
                fallback={defaults.waitNumberMilliseconds.maxMs}
                onChange={(maxMs) => onConfigChange("waitNumberMilliseconds", { maxMs })}
              />
            </div>
          ) : null}

          {toolId === "getUrlContent" ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ToolNumberField
                  id="url-min"
                  label="Min URLs"
                  description="Fewest pages read in one request."
                  value={configs.getUrlContent.minUrls}
                  min={1}
                  max={configs.getUrlContent.maxUrls}
                  fallback={defaults.getUrlContent.minUrls}
                  onChange={(minUrls) => onConfigChange("getUrlContent", { minUrls })}
                />
                <ToolNumberField
                  id="url-max"
                  label="Max URLs"
                  description="Most pages read in one request."
                  value={configs.getUrlContent.maxUrls}
                  min={configs.getUrlContent.minUrls}
                  max={200}
                  fallback={defaults.getUrlContent.maxUrls}
                  onChange={(maxUrls) => onConfigChange("getUrlContent", { maxUrls })}
                />
              </div>
              <ToolNumberField
                id="url-maxlength"
                label="Default Max Content Length"
                description="Characters read per page when no length is requested."
                value={configs.getUrlContent.defaultMaxLength}
                min={100}
                max={50000}
                fallback={defaults.getUrlContent.defaultMaxLength}
                onChange={(defaultMaxLength) =>
                  onConfigChange("getUrlContent", { defaultMaxLength })
                }
              />
            </>
          ) : null}

          {toolId === "webSearch" ? (
            <>
              <ToolNumberField
                id="search-concurrent"
                label="Max Concurrent Searches"
                description="Searches that may run at the same time."
                value={configs.webSearch.maxConcurrent}
                min={1}
                max={50}
                fallback={defaults.webSearch.maxConcurrent}
                onChange={(maxConcurrent) => onConfigChange("webSearch", { maxConcurrent })}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <ToolNumberField
                  id="search-results"
                  label="Default Max Results"
                  description="Results returned per search."
                  value={configs.webSearch.defaultMaxResults}
                  min={1}
                  max={200}
                  fallback={defaults.webSearch.defaultMaxResults}
                  onChange={(defaultMaxResults) =>
                    onConfigChange("webSearch", { defaultMaxResults })
                  }
                />
                <ToolNumberField
                  id="search-pages"
                  label="Default Max Pages"
                  description="Pages of results fetched per search."
                  value={configs.webSearch.defaultMaxPages}
                  min={1}
                  max={20}
                  fallback={defaults.webSearch.defaultMaxPages}
                  onChange={(defaultMaxPages) => onConfigChange("webSearch", { defaultMaxPages })}
                />
              </div>
            </>
          ) : null}

          {toolId === "wikipedia" ? (
            <ToolNumberField
              id="wikipedia-maxresults"
              label="Default Max Results"
              description="Results returned per Wikipedia search."
              value={configs.wikipedia.defaultMaxResults}
              min={1}
              max={50}
              fallback={defaults.wikipedia.defaultMaxResults}
              onChange={(defaultMaxResults) => onConfigChange("wikipedia", { defaultMaxResults })}
            />
          ) : null}

          {toolId === "viewFile" ? (
            <ToolNumberField
              id="viewFile-maxchars"
              label="Default Max Characters"
              description="Characters returned from a file before truncation."
              value={configs.viewFile.defaultMaxChars}
              min={100}
              max={100000}
              fallback={defaults.viewFile.defaultMaxChars}
              onChange={(defaultMaxChars) => onConfigChange("viewFile", { defaultMaxChars })}
            />
          ) : null}

          {toolId === "executeCommand" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ToolNumberField
                id="executeCommand-timeout"
                label="Default Timeout (ms)"
                description="How long a command may run before it is stopped."
                value={configs.executeCommand.defaultTimeoutMs}
                min={1000}
                max={600000}
                fallback={defaults.executeCommand.defaultTimeoutMs}
                onChange={(defaultTimeoutMs) =>
                  onConfigChange("executeCommand", { defaultTimeoutMs })
                }
              />
              <ToolNumberField
                id="executeCommand-scrollback"
                label="Max Scrollback (chars)"
                description="Command output kept for the model."
                value={configs.executeCommand.maxScrollbackChars}
                min={1000}
                max={500000}
                fallback={defaults.executeCommand.maxScrollbackChars}
                onChange={(maxScrollbackChars) =>
                  onConfigChange("executeCommand", { maxScrollbackChars })
                }
              />
            </div>
          ) : null}
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}
