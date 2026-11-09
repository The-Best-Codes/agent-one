import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS } from "@/lib/settings/definitions";
import { getMergedToolConfigs } from "@/lib/settings/tools";
import type { ToolConfigs, ToolId } from "@/lib/settings/types";

const defaults = DEFAULT_SETTINGS.TOOL_CONFIGS;

interface FieldResetButtonProps {
  label: string;
  disabled: boolean;
  onReset: () => void;
}

function FieldResetButton({ label, disabled, onReset }: FieldResetButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onReset}
      disabled={disabled}
      aria-label={`Reset ${label} to default`}
    >
      <IconRestore />
    </Button>
  );
}

interface ToolNumberFieldProps {
  id: string;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  onChange: (value: number) => void;
}

function ToolNumberField({
  id,
  label,
  description,
  value,
  min,
  max,
  defaultValue,
  onChange,
}: ToolNumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const resetValue = Math.max(min, Math.min(defaultValue, max));

  const commitDraft = () => {
    if (draft === null) {
      return;
    }

    const parsed = Number.parseInt(draft, 10);
    const nextValue = Math.max(min, Math.min(Number.isNaN(parsed) ? defaultValue : parsed, max));
    setDraft(null);

    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          min={min}
          max={max}
          value={draft ?? String(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
        />
        <FieldResetButton
          label={label}
          disabled={value === resetValue && draft === null}
          onReset={() => {
            setDraft(null);
            if (resetValue !== value) {
              onChange(resetValue);
            }
          }}
        />
      </div>
      <FieldDescription>{description}</FieldDescription>
    </Field>
  );
}

const TOOL_NAMES: Partial<Record<ToolId, string>> = {
  webSearch: "Search the web",
  getUrlContent: "Browse",
  wikipedia: "Wikipedia",
  searchChats: "Search chats",
  readChat: "Read chats",
};

interface ToolSettingsDialogProps {
  title: string;
  description: string;
  toolIds: ToolId[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolSettingsDialog({
  title,
  description,
  toolIds,
  open,
  onOpenChange,
}: ToolSettingsDialogProps) {
  const [toolConfigs, setToolConfigs] = useAtom(settingAtoms.TOOL_CONFIGS);
  const configs = getMergedToolConfigs(toolConfigs);

  const onConfigChange = <T extends ToolId>(id: T, updates: Partial<ToolConfigs[T]>) => {
    setToolConfigs((prev) => ({
      ...prev,
      [id]: { ...defaults[id], ...prev[id], ...updates },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          {toolIds.map((toolId) => (
            <ToolOptions
              key={toolId}
              toolId={toolId}
              heading={toolIds.length > 1 ? TOOL_NAMES[toolId] : undefined}
              configs={configs}
              onConfigChange={onConfigChange}
            />
          ))}
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

interface ToolOptionsProps {
  toolId: ToolId;
  heading?: string;
  configs: ToolConfigs;
  onConfigChange: <T extends ToolId>(toolId: T, updates: Partial<ToolConfigs[T]>) => void;
}

function ToolOptions({ toolId, heading, configs, onConfigChange }: ToolOptionsProps) {
  return (
    <FieldSet>
      {heading ? <FieldLegend variant="label">{heading}</FieldLegend> : null}
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
              defaultValue={defaults.getUrlContent.minUrls}
              onChange={(minUrls) => onConfigChange("getUrlContent", { minUrls })}
            />
            <ToolNumberField
              id="url-max"
              label="Max URLs"
              description="Most pages read in one request."
              value={configs.getUrlContent.maxUrls}
              min={configs.getUrlContent.minUrls}
              max={200}
              defaultValue={defaults.getUrlContent.maxUrls}
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
            defaultValue={defaults.getUrlContent.defaultMaxLength}
            onChange={(defaultMaxLength) => onConfigChange("getUrlContent", { defaultMaxLength })}
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
            defaultValue={defaults.webSearch.maxConcurrent}
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
              defaultValue={defaults.webSearch.defaultMaxResults}
              onChange={(defaultMaxResults) => onConfigChange("webSearch", { defaultMaxResults })}
            />
            <ToolNumberField
              id="search-pages"
              label="Default Max Pages"
              description="Pages of results fetched per search."
              value={configs.webSearch.defaultMaxPages}
              min={1}
              max={20}
              defaultValue={defaults.webSearch.defaultMaxPages}
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
          defaultValue={defaults.wikipedia.defaultMaxResults}
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
          defaultValue={defaults.viewFile.defaultMaxChars}
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
            defaultValue={defaults.executeCommand.defaultTimeoutMs}
            onChange={(defaultTimeoutMs) => onConfigChange("executeCommand", { defaultTimeoutMs })}
          />
          <ToolNumberField
            id="executeCommand-scrollback"
            label="Max Scrollback (chars)"
            description="Command output kept for the model."
            value={configs.executeCommand.maxScrollbackChars}
            min={1000}
            max={500000}
            defaultValue={defaults.executeCommand.maxScrollbackChars}
            onChange={(maxScrollbackChars) =>
              onConfigChange("executeCommand", { maxScrollbackChars })
            }
          />
        </div>
      ) : null}

      {toolId === "searchChats" ? (
        <ToolNumberField
          id="searchChats-maxresults"
          label="Default Max Results"
          description="Chats returned per search."
          value={configs.searchChats.defaultMaxResults}
          min={1}
          max={50}
          defaultValue={defaults.searchChats.defaultMaxResults}
          onChange={(defaultMaxResults) => onConfigChange("searchChats", { defaultMaxResults })}
        />
      ) : null}

      {toolId === "readChat" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ToolNumberField
            id="readChat-defaultmaxchars"
            label="Default Read Length (chars)"
            description="Characters of a chat read at a time, unless AgentOne asks for more or less."
            value={configs.readChat.defaultMaxChars}
            min={1000}
            max={configs.readChat.maxChars}
            defaultValue={defaults.readChat.defaultMaxChars}
            onChange={(defaultMaxChars) => onConfigChange("readChat", { defaultMaxChars })}
          />
          <ToolNumberField
            id="readChat-maxchars"
            label="Max Read Length (chars)"
            description="The most characters AgentOne can read from a chat at once."
            value={configs.readChat.maxChars}
            min={5000}
            max={100000}
            defaultValue={defaults.readChat.maxChars}
            onChange={(maxChars) =>
              onConfigChange("readChat", {
                maxChars,
                defaultMaxChars: Math.min(configs.readChat.defaultMaxChars, maxChars),
              })
            }
          />
        </div>
      ) : null}
    </FieldSet>
  );
}
