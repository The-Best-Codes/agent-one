import { Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useModel } from "@/contexts/use-model/model-hooks";

export const ChatModelConfig = () => {
  const { currentModelConfig, setModelConfig } = useModel();

  const handleTemperatureChange = (value: number[]) => {
    setModelConfig({ ...currentModelConfig, temperature: value[0] });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? undefined : parseInt(e.target.value);
    setModelConfig({ ...currentModelConfig, maxTokens: val });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Model configuration">
          <Settings2Icon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
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

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              placeholder="Unlimited"
              value={currentModelConfig.maxTokens ?? ""}
              onChange={handleMaxTokensChange}
            />
            <p className="text-muted-foreground text-xs">
              Leave empty for model default.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
