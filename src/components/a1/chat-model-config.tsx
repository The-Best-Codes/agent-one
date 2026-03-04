import { InfoIcon, RotateCcwIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModel } from "@/contexts/use-model/model-hooks";
import { DEFAULT_MODEL_CONFIG } from "@/hooks/ai/use-model-catalog";
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

  const handleSliderChange = (values: number[]) => {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-sm",
              isUnset ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {isUnset ? "Default" : value}
          </span>
          {!isUnset && (
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={handleClear}
              title={`Reset ${label} config`}
              aria-label={`Reset ${label} config`}
            >
              <RotateCcwIcon className="size-3" />
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
          value={[value]}
          onValueChange={handleSliderChange}
        />
      )}
    </div>
  );
};

export const ChatModelConfig = ({
  disabled = false,
}: {
  disabled?: boolean;
}) => {
  const { currentModelConfig, setModelConfig } = useModel();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const effectiveOpen = disabled ? false : open;

  const handleTemperatureChange = (value: number | undefined) => {
    setModelConfig({ ...currentModelConfig, temperature: value });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, maxTokens: val });
  };

  const handleTopPChange = (value: number | undefined) => {
    setModelConfig({ ...currentModelConfig, topP: value });
  };

  const handleTopKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, topK: val });
  };

  const handleMaxStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, maxSteps: val });
  };

  const handleFrequencyPenaltyChange = (value: number | undefined) => {
    setModelConfig({ ...currentModelConfig, frequencyPenalty: value });
  };

  const handlePresencePenaltyChange = (value: number | undefined) => {
    setModelConfig({ ...currentModelConfig, presencePenalty: value });
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, seed: val });
  };

  const resetToDefaults = () => {
    setModelConfig({
      temperature: DEFAULT_MODEL_CONFIG.temperature,
      maxTokens: DEFAULT_MODEL_CONFIG.maxTokens,
      maxSteps: DEFAULT_MODEL_CONFIG.maxSteps,
      topP: DEFAULT_MODEL_CONFIG.topP,
      topK: DEFAULT_MODEL_CONFIG.topK,
      frequencyPenalty: DEFAULT_MODEL_CONFIG.frequencyPenalty,
      presencePenalty: DEFAULT_MODEL_CONFIG.presencePenalty,
      seed: DEFAULT_MODEL_CONFIG.seed,
    });
  };

  const isAtDefaults =
    currentModelConfig.temperature === DEFAULT_MODEL_CONFIG.temperature &&
    currentModelConfig.maxTokens === DEFAULT_MODEL_CONFIG.maxTokens &&
    currentModelConfig.maxSteps === DEFAULT_MODEL_CONFIG.maxSteps &&
    currentModelConfig.topP === DEFAULT_MODEL_CONFIG.topP &&
    currentModelConfig.topK === DEFAULT_MODEL_CONFIG.topK &&
    currentModelConfig.frequencyPenalty ===
      DEFAULT_MODEL_CONFIG.frequencyPenalty &&
    currentModelConfig.presencePenalty ===
      DEFAULT_MODEL_CONFIG.presencePenalty &&
    currentModelConfig.seed === DEFAULT_MODEL_CONFIG.seed;

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
          <RotateCcwIcon className="size-4" />
          <span className="sr-only">Reset all</span>
        </Button>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Only sample from the top K options for each subsequent token. Used
              to remove "long tail" low probability responses. Recommended for
              advanced use cases only. Leave empty to use model default.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="topK"
          type="number"
          placeholder="Default"
          min={1}
          value={currentModelConfig.topK ?? ""}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Maximum number of reasoning/tool steps in one response. Leave
              empty for no step limit.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="maxSteps"
          type="number"
          placeholder="Default"
          min={0}
          max={1000}
          value={currentModelConfig.maxSteps ?? ""}
          onChange={handleMaxStepsChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Maximum number of tokens (words/sub-words) in the model response.
              Leave empty to use the model's default limit.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="maxTokens"
          type="number"
          placeholder="Default"
          value={currentModelConfig.maxTokens ?? ""}
          onChange={handleMaxTokensChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="seed">Seed</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="text-muted-foreground size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Integer seed for random sampling. If set and supported by the
              model, calls will generate deterministic results. Leave empty for
              random behavior.
            </TooltipContent>
          </Tooltip>
        </div>
        <Input
          id="seed"
          type="number"
          placeholder="Default"
          value={currentModelConfig.seed ?? ""}
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
      className="relative"
      disabled={disabled}
    >
      <Settings2Icon className="size-4" />
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
          <PopoverContent className="max-h-[70vh] w-80 overflow-auto p-4">
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={effectiveOpen} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent className="max-h-[70vh]" showHandle={false}>
            <ScrollArea className="max-h-[calc(70vh-2rem)] overflow-auto">
              <div className="p-4">{content}</div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};
