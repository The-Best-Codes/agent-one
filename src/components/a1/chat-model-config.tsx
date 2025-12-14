import { InfoIcon, RotateCcwIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModel } from "@/contexts/use-model/model-hooks";
import { DEFAULT_MODEL_CONFIG } from "@/lib/ai/models";

// TODO: Support topP, topK, frequencyPenalty, etc. that AI SDK supports
export const ChatModelConfig = () => {
  const { currentModelConfig, setModelConfig } = useModel();

  const handleTemperatureChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, temperature: value[0] });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, maxTokens: val });
  };

  const resetToDefaults = () => {
    setModelConfig({
      temperature: DEFAULT_MODEL_CONFIG.temperature,
      maxTokens: DEFAULT_MODEL_CONFIG.maxTokens,
    });
  };

  const isAtDefaults =
    currentModelConfig.temperature === DEFAULT_MODEL_CONFIG.temperature &&
    currentModelConfig.maxTokens === DEFAULT_MODEL_CONFIG.maxTokens;

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Model configuration"
          >
            <Settings2Icon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
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
                      Controls randomness in responses. Higher values (1.0-2.0)
                      make output more creative and random, while lower values
                      (0.0-1.0) make it more focused and deterministic.
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
              <div className="flex items-center gap-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="text-muted-foreground size-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    Maximum number of tokens (words/sub-words) in the model
                    response. Leave empty to use the model's default limit.
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
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
