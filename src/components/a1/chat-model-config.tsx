import { IconAdjustments, IconInfoCircle, IconRestore } from "@tabler/icons-react";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModel } from "@/contexts/use-model/model-hooks";
import {
  DEFAULT_MODEL_CONFIG,
  getToolBehavior,
  type ToolBehavior,
} from "@/hooks/ai/use-model-catalog";
import { useMediaQuery } from "@/hooks/use-media-query";
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
    label: "Default",
    description: "Use enabled tools and ask for approval only when each tool requires it.",
  },
  {
    value: "ask",
    label: "Ask",
    description: "Ask for your approval before running every tool.",
  },
  {
    value: "yolo",
    label: "YOLO",
    description: "Run tools without asking for approval. Use with caution.",
  },
  {
    value: "disable",
    label: "Disable",
    description: "Do not make any tools available to the model.",
  },
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

export const ChatModelConfig = ({
  disabled = false,
  triggerClassName,
}: {
  disabled?: boolean;
  triggerClassName?: string;
}) => {
  const { currentModelConfig, setModelConfig } = useModel();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const effectiveOpen = disabled ? false : open;
  const toolBehavior = getToolBehavior(currentModelConfig);

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
    toolBehavior === DEFAULT_MODEL_CONFIG.toolBehavior;

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
        <Tabs
          value={toolBehavior}
          onValueChange={(value) => {
            setModelConfig({
              ...configRef.current,
              toolBehavior: value as ToolBehavior,
            });
          }}
        >
          <TabsList className="w-full">
            {TOOL_BEHAVIORS.map((behavior) => (
              <TabsTrigger key={behavior.value} value={behavior.value}>
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <span>{behavior.label}</span>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent className="max-w-xs">
                    {behavior.description}
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

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
      {isDesktop ? (
        <Popover open={effectiveOpen} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="max-h-80 w-64 overflow-auto p-4">{content}</PopoverContent>
        </Popover>
      ) : (
        <Drawer open={effectiveOpen} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="bg-popover">
            <DrawerHeader>
              <DrawerTitle className="sr-only">Model Configuration</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-4">{content}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};
