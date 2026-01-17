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

export const ChatModelConfig = () => {
  const { currentModelConfig, setModelConfig } = useModel();
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const handleTemperatureChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, temperature: value[0] });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, maxTokens: val });
  };

  const handleTopPChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, topP: value[0] });
  };

  const handleTopKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, topK: val });
  };

  const handleFrequencyPenaltyChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, frequencyPenalty: value[0] });
  };

  const handlePresencePenaltyChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, presencePenalty: value[0] });
  };

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, seed: val });
  };

  const resetToDefaults = () => {
    setModelConfig({
      temperature: DEFAULT_MODEL_CONFIG.temperature,
      maxTokens: DEFAULT_MODEL_CONFIG.maxTokens,
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="text-muted-foreground size-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Controls randomness in responses. Higher values (1.0-2.0) make
                output more creative and random, while lower values (0.0-1.0)
                make it more focused and deterministic.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            {currentModelConfig.temperature}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={2}
          step={0.1}
          value={[currentModelConfig.temperature]}
          onValueChange={handleTemperatureChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="topP">Top P</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="text-muted-foreground size-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Nucleus sampling. Controls diversity by limiting token selection
                to a cumulative probability. Lower values (e.g., 0.1) make
                output more focused, higher values (e.g., 0.9) allow more
                variety. It's recommended to set either temperature or topP, but
                not both.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            {currentModelConfig.topP ?? 1}
          </span>
        </div>
        <Slider
          id="topP"
          min={0}
          max={1}
          step={0.05}
          value={[currentModelConfig.topP ?? 1]}
          onValueChange={handleTopPChange}
        />
      </div>

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="text-muted-foreground size-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Reduces the likelihood of the model repeatedly using the same
                words or phrases. Higher values (up to 2.0) discourage
                repetition more strongly.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            {currentModelConfig.frequencyPenalty ?? 0}
          </span>
        </div>
        <Slider
          id="frequencyPenalty"
          min={0}
          max={2}
          step={0.1}
          value={[currentModelConfig.frequencyPenalty ?? 0]}
          onValueChange={handleFrequencyPenaltyChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="presencePenalty">Presence Penalty</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="text-muted-foreground size-3 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Reduces the likelihood of the model repeating information
                already in the prompt. Higher values (up to 2.0) encourage the
                model to introduce new topics.
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            {currentModelConfig.presencePenalty ?? 0}
          </span>
        </div>
        <Slider
          id="presencePenalty"
          min={0}
          max={2}
          step={0.1}
          value={[currentModelConfig.presencePenalty ?? 0]}
          onValueChange={handlePresencePenaltyChange}
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
          placeholder="Unlimited"
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
          placeholder="Random"
          value={currentModelConfig.seed ?? ""}
          onChange={handleSeedChange}
        />
      </div>
    </div>
  );

  const trigger = (
    <Button variant="outline" size="icon" aria-label="Model configuration">
      <Settings2Icon className="size-4" />
    </Button>
  );

  return (
    <>
      {isDesktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="max-h-[70vh] w-80 overflow-auto p-4">
            {content}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
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
