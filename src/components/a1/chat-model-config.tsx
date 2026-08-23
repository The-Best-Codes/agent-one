import { IconAdjustments, IconInfoCircle, IconRestore } from "@tabler/icons-react";
import debounce from "lodash.debounce";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useModel } from "@/contexts/use-model/model-hooks";
import {
  DEFAULT_MODEL_CONFIG,
  getToolBehavior,
  type ToolBehavior,
} from "@/hooks/ai/use-model-catalog";
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

const TOOL_BEHAVIORS: { value: ToolBehavior; labelKey: string; descriptionKey: string }[] = [
  {
    value: "default",
    labelKey: "chat.toolBehaviorDefault",
    descriptionKey: "chat.toolBehaviorDefaultDescription",
  },
  {
    value: "ask",
    labelKey: "chat.toolBehaviorAsk",
    descriptionKey: "chat.toolBehaviorAskDescription",
  },
  {
    value: "yolo",
    labelKey: "chat.toolBehaviorYolo",
    descriptionKey: "chat.toolBehaviorYoloDescription",
  },
  {
    value: "disable",
    labelKey: "chat.toolBehaviorDisable",
    descriptionKey: "chat.toolBehaviorDisableDescription",
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
  const { t } = useTranslation();
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
            {isUnset ? t("common.default") : displayValue}
          </span>
          {!isUnset && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-5"
              onClick={handleClear}
              title={t("chat.resetLabelConfig", { label })}
              aria-label={t("chat.resetLabelConfig", { label })}
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
          {t("chat.setCustomValue")}
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
  const { t } = useTranslation();
  const { currentModelConfig, setModelConfig } = useModel();
  const [open, setOpen] = useState(false);
  const effectiveOpen = disabled ? false : open;
  const toolBehavior = getToolBehavior(currentModelConfig);
  const selectedBehavior = TOOL_BEHAVIORS.find((behavior) => behavior.value === toolBehavior);

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
        <h3 className="text-lg font-semibold">{t("chat.modelConfig")}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-fit"
          onClick={resetToDefaults}
          disabled={isAtDefaults}
        >
          <IconRestore data-icon="inline-start" />
          <span className="sr-only">{t("chat.resetAll")}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label>{t("chat.toolBehavior")}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {t("chat.toolBehaviorTooltip")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Select
          value={toolBehavior}
          onValueChange={(value) => {
            setModelConfig({
              ...configRef.current,
              toolBehavior: value as ToolBehavior,
            });
          }}
        >
          <SelectTrigger id="toolBehavior" className="w-full">
            <SelectValue>{selectedBehavior ? t(selectedBehavior.labelKey) : ""}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TOOL_BEHAVIORS.map((behavior) => (
              <SelectItem key={behavior.value} value={behavior.value}>
                {t(behavior.labelKey)}
                <AdaptiveTooltip>
                  <AdaptiveTooltipTrigger asChild>
                    <span className="-ml-1 inline-flex cursor-help">
                      <IconInfoCircle className="text-muted-foreground size-3" />
                    </span>
                  </AdaptiveTooltipTrigger>
                  <AdaptiveTooltipContent side="right" className="max-w-xs">
                    {t(behavior.descriptionKey)}
                  </AdaptiveTooltipContent>
                </AdaptiveTooltip>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SliderConfig
        id="temperature"
        label={t("chat.temperature")}
        tooltip={t("chat.temperatureTooltip")}
        value={currentModelConfig.temperature}
        min={0}
        max={2}
        step={0.1}
        onChange={handleTemperatureChange}
      />

      <SliderConfig
        id="topP"
        label={t("chat.topP")}
        tooltip={t("chat.topPTooltip")}
        value={currentModelConfig.topP}
        min={0}
        max={1}
        step={0.05}
        onChange={handleTopPChange}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="topK">{t("chat.topK")}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {t("chat.topKTooltip")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="topK"
          type="number"
          placeholder={t("common.default")}
          min={1}
          value={localInputs.topK ?? ""}
          onChange={handleTopKChange}
        />
      </div>

      <SliderConfig
        id="frequencyPenalty"
        label={t("chat.frequencyPenalty")}
        tooltip={t("chat.frequencyPenaltyTooltip")}
        value={currentModelConfig.frequencyPenalty}
        min={0}
        max={2}
        step={0.1}
        onChange={handleFrequencyPenaltyChange}
      />

      <SliderConfig
        id="presencePenalty"
        label={t("chat.presencePenalty")}
        tooltip={t("chat.presencePenaltyTooltip")}
        value={currentModelConfig.presencePenalty}
        min={0}
        max={2}
        step={0.1}
        onChange={handlePresencePenaltyChange}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxSteps">{t("chat.maxSteps")}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {t("chat.maxStepsTooltip")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="maxSteps"
          type="number"
          placeholder={t("common.default")}
          min={0}
          max={1000}
          value={localInputs.maxSteps ?? ""}
          onChange={handleMaxStepsChange}
          disabled={toolBehavior === "disable"}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="maxTokens">{t("chat.maxTokens")}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {t("chat.maxTokensTooltip")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="maxTokens"
          type="number"
          placeholder={t("common.default")}
          value={localInputs.maxTokens ?? ""}
          onChange={handleMaxTokensChange}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="seed">{t("chat.seed")}</Label>
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <IconInfoCircle className="text-muted-foreground size-3 cursor-help" />
            </AdaptiveTooltipTrigger>
            <AdaptiveTooltipContent side="right" className="max-w-xs">
              {t("chat.seedTooltip")}
            </AdaptiveTooltipContent>
          </AdaptiveTooltip>
        </div>
        <Input
          id="seed"
          type="number"
          placeholder={t("common.default")}
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
      aria-label={t("chat.modelConfiguration")}
      className={cn("relative", triggerClassName)}
      disabled={disabled}
    >
      <IconAdjustments data-icon="inline-start" />
      {!isAtDefaults && (
        <span
          title={t("chat.modelConfigModified")}
          className="bg-primary absolute -top-0.5 -right-0.5 flex size-2 rounded-full"
        ></span>
      )}
    </Button>
  );

  return (
    <AdaptivePopover open={effectiveOpen} onOpenChange={setOpen}>
      <AdaptivePopoverTrigger asChild>{trigger}</AdaptivePopoverTrigger>
      <AdaptivePopoverContent
        title={t("chat.modelConfigTitle")}
        className="max-h-80 w-64 overflow-auto p-4"
      >
        {content}
      </AdaptivePopoverContent>
    </AdaptivePopover>
  );
};
