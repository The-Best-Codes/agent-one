import { IconAdjustments, IconInfoCircle, IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";

import { YoloModeDialog } from "@/components/a1/yolo-mode-dialog";
import {
  AdaptivePopover,
  AdaptivePopoverContent,
  AdaptivePopoverTrigger,
} from "@/components/ui/adaptive-popover";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useModel } from "@/contexts/use-model/model-hooks";
import {
  DEFAULT_MODEL_CONFIG,
  getReasoningEffort,
  getToolBehavior,
  type ReasoningEffort,
  type ToolBehavior,
} from "@/hooks/ai/use-model-catalog";
import {
  DEFAULT_COMPACTION_THRESHOLD,
  getCompactionThreshold,
  MAX_COMPACTION_THRESHOLD,
  MIN_COMPACTION_THRESHOLD,
} from "@/lib/ai/compaction";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

interface SliderConfigProps {
  id: string;
  label: string;
  tooltip: string;
  value: number | undefined;
  min: number;
  max: number;
  step: number;
  onChange: (value: number | undefined) => void;
}

const TOOL_BEHAVIORS: { value: ToolBehavior; label: string; description: string }[] = [
  {
    value: "default",
    label: "Per-tool approval",
    description: "Use enabled tools and ask for approval only when each tool requires it.",
  },
  {
    value: "ask",
    label: "Always ask",
    description: "Ask for your approval before running every tool.",
  },
  {
    value: "yolo",
    label: "YOLO (auto-run)",
    description: "Run tools without asking for approval. Use with caution.",
  },
  {
    value: "disable",
    label: "No tools",
    description: "Do not make any tools available to the model.",
  },
];

const DEFAULT_REASONING_EFFORT = "default";

const REASONING_EFFORT_OPTIONS: {
  value: ReasoningEffort | typeof DEFAULT_REASONING_EFFORT;
  label: string;
}[] = [
  { value: DEFAULT_REASONING_EFFORT, label: "Default" },
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
  { value: "max", label: "Max" },
];

const SliderConfig = ({
  id,
  label,
  tooltip,
  value,
  min,
  max,
  step,
  onChange,
}: SliderConfigProps) => {
  const isUnset = value === undefined;
  const midpoint = (min + max) / 2;
  const [draggingValue, setDraggingValue] = useState<number | null>(null);

  const displayValue = draggingValue ?? value;

  const handleSliderChange = (values: number[]) => {
    setDraggingValue(values[0]);
  };

  const handleSliderCommit = (values: number[]) => {
    setDraggingValue(null);
    onChange(values[0]);
  };

  const handleClear = () => {
    onChange(undefined);
  };

  const handleSetCustomValue = () => {
    onChange(midpoint);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={id}>{label}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {tooltip}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <div className="flex items-center gap-1">
          <span className={cn("text-sm", isUnset ? "text-muted-foreground" : "text-foreground")}>
            {isUnset ? "Default" : displayValue}
          </span>
          {!isUnset && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-5"
              onClick={handleClear}
              title={`Reset ${label} config`}
              aria-label={`Reset ${label} config`}
            >
              <IconRestore data-icon="inline-start" />
            </Button>
          )}
        </div>
      </div>
      {isUnset ? (
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-fit px-2 text-xs"
          onClick={handleSetCustomValue}
        >
          Set custom value
        </Button>
      ) : (
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[displayValue!]}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
        />
      )}
    </div>
  );
};

const CompactionConfig = ({
  threshold,
  onChange,
}: {
  threshold: number | null;
  onChange: (value: number | "off") => void;
}) => {
  const [draggingValue, setDraggingValue] = useState<number | null>(null);
  const isEnabled = threshold !== null;
  const displayValue = draggingValue ?? threshold ?? DEFAULT_COMPACTION_THRESHOLD;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="autoCompact">Auto-Compact</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Automatically summarize earlier parts of the conversation once it uses this much of
              the model's context window, so long chats can keep going.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <div className="flex items-center gap-2">
          {isEnabled && <span className="text-foreground text-sm">{displayValue}%</span>}
          <Switch
            id="autoCompact"
            size="sm"
            checked={isEnabled}
            onCheckedChange={(checked) => onChange(checked ? DEFAULT_COMPACTION_THRESHOLD : "off")}
          />
        </div>
      </div>
      {isEnabled && (
        <Slider
          min={MIN_COMPACTION_THRESHOLD}
          max={MAX_COMPACTION_THRESHOLD}
          step={1}
          value={[displayValue]}
          onValueChange={(values) => setDraggingValue(values[0])}
          onValueCommit={(values) => {
            setDraggingValue(null);
            onChange(values[0]);
          }}
          aria-label="Auto-compact threshold"
        />
      )}
    </div>
  );
};

export const ChatModelConfig = ({
  disabled = false,
  triggerClassName,
}: {
  disabled?: boolean;
  triggerClassName?: string;
}) => {
  const { currentModelConfig, setModelConfig } = useModel();
  const [open, setOpen] = useState(false);
  const effectiveOpen = disabled ? false : open;
  const toolBehavior = getToolBehavior(currentModelConfig);
  const selectedBehavior = TOOL_BEHAVIORS.find((behavior) => behavior.value === toolBehavior);
  const reasoningEffort = getReasoningEffort(currentModelConfig);
  const compactionThreshold = getCompactionThreshold(currentModelConfig);
  const selectedReasoningEffort = REASONING_EFFORT_OPTIONS.find(
    (option) => option.value === (reasoningEffort ?? DEFAULT_REASONING_EFFORT),
  );
  const [confirmYoloMode, setConfirmYoloMode] = useAtom(settingAtoms.CONFIRM_YOLO_MODE);
  const [yoloDialogOpen, setYoloDialogOpen] = useState(false);

  const [localInputs, setLocalInputs] = useState({
    maxTokens: currentModelConfig.maxTokens,
    topK: currentModelConfig.topK,
    maxSteps: currentModelConfig.maxSteps,
    seed: currentModelConfig.seed,
  });

  const configRef = useRef(currentModelConfig);
  useEffect(() => {
    configRef.current = currentModelConfig;
  }, [currentModelConfig]);

  const debouncedSetModelConfig = useMemo(
    () => debounce((config: Parameters<typeof setModelConfig>[0]) => setModelConfig(config), 300),
    [setModelConfig],
  );

  useEffect(() => () => debouncedSetModelConfig.cancel(), [debouncedSetModelConfig]);

  const setToolBehavior = (value: ToolBehavior) => {
    setModelConfig({ ...configRef.current, toolBehavior: value });
  };

  const handleToolBehaviorChange = (value: ToolBehavior) => {
    if (value === "yolo" && confirmYoloMode !== false) {
      setYoloDialogOpen(true);
      return;
    }
    setToolBehavior(value);
  };

  const handleYoloConfirm = (dontShowAgain: boolean) => {
    if (dontShowAgain) setConfirmYoloMode(false);
    setToolBehavior("yolo");
  };

  const handleReasoningEffortChange = (value: string) => {
    setModelConfig({
      ...configRef.current,
      reasoningEffort: value === DEFAULT_REASONING_EFFORT ? undefined : (value as ReasoningEffort),
    });
  };

  const handleCompactionThresholdChange = (value: number | "off") => {
    setModelConfig({
      ...configRef.current,
      compactionThreshold: value === DEFAULT_COMPACTION_THRESHOLD ? undefined : value,
    });
  };

  const handleTemperatureChange = (value: number | undefined) => {
    setModelConfig({ ...configRef.current, temperature: value });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setLocalInputs((prev) => ({ ...prev, maxTokens: val }));
    debouncedSetModelConfig({ ...configRef.current, maxTokens: val });
  };

  const handleTopPChange = (value: number | undefined) => {
    setModelConfig({ ...configRef.current, topP: value });
  };

  const handleTopKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setLocalInputs((prev) => ({ ...prev, topK: val }));
    debouncedSetModelConfig({ ...configRef.current, topK: val });
  };

  const handleMaxStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setLocalInputs((prev) => ({ ...prev, maxSteps: val }));
    debouncedSetModelConfig({ ...configRef.current, maxSteps: val });
  };

  const handleFrequencyPenaltyChange = (value: number | undefined) => {
    setModelConfig({ ...configRef.current, frequencyPenalty: value });
  };

  const handlePresencePenaltyChange = (value: number | undefined) => {
    setModelConfig({ ...configRef.current, presencePenalty: value });
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setLocalInputs((prev) => ({ ...prev, seed: val }));
    debouncedSetModelConfig({ ...configRef.current, seed: val });
  };

  const resetToDefaults = () => {
    debouncedSetModelConfig.cancel();
    setLocalInputs({
      maxTokens: DEFAULT_MODEL_CONFIG.maxTokens,
      topK: DEFAULT_MODEL_CONFIG.topK,
      maxSteps: DEFAULT_MODEL_CONFIG.maxSteps,
      seed: DEFAULT_MODEL_CONFIG.seed,
    });
    setModelConfig({
      temperature: DEFAULT_MODEL_CONFIG.temperature,
      maxTokens: DEFAULT_MODEL_CONFIG.maxTokens,
      maxSteps: DEFAULT_MODEL_CONFIG.maxSteps,
      topP: DEFAULT_MODEL_CONFIG.topP,
      topK: DEFAULT_MODEL_CONFIG.topK,
      frequencyPenalty: DEFAULT_MODEL_CONFIG.frequencyPenalty,
      presencePenalty: DEFAULT_MODEL_CONFIG.presencePenalty,
      seed: DEFAULT_MODEL_CONFIG.seed,
      toolBehavior: DEFAULT_MODEL_CONFIG.toolBehavior,
      reasoningEffort: DEFAULT_MODEL_CONFIG.reasoningEffort,
      compactionThreshold: DEFAULT_MODEL_CONFIG.compactionThreshold,
    });
  };

  const isAtDefaults =
    currentModelConfig.temperature === DEFAULT_MODEL_CONFIG.temperature &&
    currentModelConfig.maxTokens === DEFAULT_MODEL_CONFIG.maxTokens &&
    currentModelConfig.maxSteps === DEFAULT_MODEL_CONFIG.maxSteps &&
    currentModelConfig.topP === DEFAULT_MODEL_CONFIG.topP &&
    currentModelConfig.topK === DEFAULT_MODEL_CONFIG.topK &&
    currentModelConfig.frequencyPenalty === DEFAULT_MODEL_CONFIG.frequencyPenalty &&
    currentModelConfig.presencePenalty === DEFAULT_MODEL_CONFIG.presencePenalty &&
    currentModelConfig.seed === DEFAULT_MODEL_CONFIG.seed &&
    toolBehavior === DEFAULT_MODEL_CONFIG.toolBehavior &&
    reasoningEffort === DEFAULT_MODEL_CONFIG.reasoningEffort &&
    compactionThreshold === getCompactionThreshold(DEFAULT_MODEL_CONFIG);

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Model Config</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-fit"
          onClick={resetToDefaults}
          disabled={isAtDefaults}
        >
          <IconRestore data-icon="inline-start" />
          <span className="sr-only">Reset all</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label>Tool Behavior</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Choose whether tools are available and when they need your approval.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Select
          value={toolBehavior}
          onValueChange={(value) => handleToolBehaviorChange(value as ToolBehavior)}
        >
          <SelectTrigger id="toolBehavior" className="w-full">
            <SelectValue>{selectedBehavior ? selectedBehavior.label : ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TOOL_BEHAVIORS.map((behavior) => (
                <SelectItem key={behavior.value} value={behavior.value}>
                  {behavior.label}
                  <AdaptiveTooltip>
                    <AdaptiveTooltipTrigger asChild>
                      <span className="-ml-1 inline-flex cursor-help">
                        <IconInfoCircle className="text-muted-foreground size-3" />
                      </span>
                    </AdaptiveTooltipTrigger>
                    <AdaptiveTooltipContent side="right" className="max-w-xs">
                      {behavior.description}
                    </AdaptiveTooltipContent>
                  </AdaptiveTooltip>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="reasoningEffort">Reasoning Effort</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              How much the model thinks before it responds. Higher effort can give better answers
              but takes longer and uses more tokens. Only applies to models that support reasoning.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Select
          value={reasoningEffort ?? DEFAULT_REASONING_EFFORT}
          onValueChange={handleReasoningEffortChange}
        >
          <SelectTrigger id="reasoningEffort" className="w-full">
            <SelectValue>{selectedReasoningEffort?.label ?? ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {REASONING_EFFORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <CompactionConfig
        threshold={compactionThreshold}
        onChange={handleCompactionThresholdChange}
      />

      <SliderConfig
        id="temperature"
        label="Temperature"
        tooltip="Controls randomness in responses. Higher values (1.0-2.0) make output more creative and random, while lower values (0.0-1.0) make it more focused and deterministic."
        value={currentModelConfig.temperature}
        min={0}
        max={2}
        step={0.1}
        onChange={handleTemperatureChange}
      />

      <SliderConfig
        id="topP"
        label="Top P"
        tooltip="Nucleus sampling. Controls diversity by limiting token selection to a cumulative probability. Lower values (e.g., 0.1) make output more focused, higher values (e.g., 0.9) allow more variety. It's recommended to set either temperature or topP, but not both."
        value={currentModelConfig.topP}
        min={0}
        max={1}
        step={0.05}
        onChange={handleTopPChange}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="topK">Top K</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Only sample from the top K options for each subsequent token. Used to remove "long
              tail" low probability responses. Recommended for advanced use cases only. Leave empty
              to use model default.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="topK"
          type="number"
          placeholder="Default"
          min={1}
          value={localInputs.topK ?? ""}
          onChange={handleTopKChange}
        />
      </div>

      <SliderConfig
        id="frequencyPenalty"
        label="Frequency Penalty"
        tooltip="Reduces the likelihood of the model repeatedly using the same words or phrases. Higher values (up to 2.0) discourage repetition more strongly."
        value={currentModelConfig.frequencyPenalty}
        min={0}
        max={2}
        step={0.1}
        onChange={handleFrequencyPenaltyChange}
      />

      <SliderConfig
        id="presencePenalty"
        label="Presence Penalty"
        tooltip="Reduces the likelihood of the model repeating information already in the prompt. Higher values (up to 2.0) encourage the model to introduce new topics."
        value={currentModelConfig.presencePenalty}
        min={0}
        max={2}
        step={0.1}
        onChange={handlePresencePenaltyChange}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxSteps">Max Steps</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Maximum number of reasoning/tool steps in one response. Leave empty for no step limit.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="maxSteps"
          type="number"
          placeholder="Default"
          min={0}
          max={1000}
          value={localInputs.maxSteps ?? ""}
          onChange={handleMaxStepsChange}
          disabled={toolBehavior === "disable"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Maximum number of tokens (words/sub-words) in the model response. Leave empty to use
              the model's default limit.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="maxTokens"
          type="number"
          placeholder="Default"
          value={localInputs.maxTokens ?? ""}
          onChange={handleMaxTokensChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="seed">Seed</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              Integer seed for random sampling. If set and supported by the model, calls will
              generate deterministic results. Leave empty for random behavior.
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="seed"
          type="number"
          placeholder="Default"
          value={localInputs.seed ?? ""}
          onChange={handleSeedChange}
        />
      </div>
    </div>
  );

  const trigger = (
    <Button
      variant="outline"
      size="icon"
      aria-label="Model configuration"
      className={cn("relative", triggerClassName)}
      disabled={disabled}
    >
      <IconAdjustments data-icon="inline-start" />
      {!isAtDefaults && (
        <span
          title="Model config has been modified"
          className="bg-primary absolute -top-0.5 -right-0.5 flex size-2 rounded-full"
        ></span>
      )}
    </Button>
  );

  return (
    <>
      <AdaptivePopover open={effectiveOpen} onOpenChange={setOpen}>
        <AdaptivePopoverTrigger asChild>{trigger}</AdaptivePopoverTrigger>
        <AdaptivePopoverContent
          title="Model Configuration"
          className="max-h-80 w-64 overflow-auto p-4"
        >
          {content}
        </AdaptivePopoverContent>
      </AdaptivePopover>
      <YoloModeDialog
        open={yoloDialogOpen}
        onOpenChange={setYoloDialogOpen}
        onConfirm={handleYoloConfirm}
      />
    </>
  );
};
