import { useAtom } from "jotai";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import type { TitleGenerationMethodOption, TitleGenerationSettings } from "@/lib/settings/types";

import { SettingsRow } from "./setting-controls";

const TITLE_METHODS: Record<TitleGenerationMethodOption, string> = {
  ai: "AI generated",
  "first-user-message": "First user message",
  "first-assistant-message": "First assistant message",
  custom: "Custom phrase",
};

const FALLBACK_METHODS = Object.entries(TITLE_METHODS).filter(([method]) => method !== "ai");

function useTitleGeneration() {
  const [titleGeneration, setTitleGeneration] = useAtom(settingAtoms.TITLE_GENERATION);

  const updateTitleGeneration = (updates: Partial<TitleGenerationSettings>) => {
    setTitleGeneration((prev) => ({ ...prev, ...updates }));
  };

  return [titleGeneration, updateTitleGeneration] as const;
}

function MethodSelect({
  value,
  options,
  onValueChange,
  label,
}: {
  value: string;
  options: [string, string][];
  onValueChange: (value: string) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full md:w-fit md:max-w-96" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(([option, optionLabel]) => (
            <SelectItem key={option} value={option}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function TitleMethodControl() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();

  return (
    <MethodSelect
      label="Select generation method"
      value={titleGeneration.method}
      options={Object.entries(TITLE_METHODS)}
      onValueChange={(method) =>
        updateTitleGeneration({ method: method as TitleGenerationMethodOption })
      }
    />
  );
}

export function TitleFallbackMethodControl() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();

  return (
    <MethodSelect
      label="Select fallback method"
      value={titleGeneration.fallbackMethod ?? "custom"}
      options={FALLBACK_METHODS}
      onValueChange={(fallbackMethod) =>
        updateTitleGeneration({
          fallbackMethod: fallbackMethod as TitleGenerationSettings["fallbackMethod"],
        })
      }
    />
  );
}

export function TitleMaxOutputTokens() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();
  const maxOutputTokens = titleGeneration.maxOutputTokens ?? 10240;

  return (
    <SettingsRow
      layout="slider"
      label={`Max Output Tokens: ${maxOutputTokens === "none" ? "No limit" : maxOutputTokens.toLocaleString()}`}
      description="Maximum tokens available for AI title generation. Use no limit if title generation fails with thinking models. Manually generated titles don't respect this setting."
    >
      <Slider
        value={[maxOutputTokens === "none" ? 0 : maxOutputTokens]}
        onValueChange={([value]) =>
          updateTitleGeneration({ maxOutputTokens: value === 0 ? "none" : value })
        }
        min={0}
        max={64000}
        step={64}
        aria-label="Title generation max output tokens"
      />
    </SettingsRow>
  );
}

export function TitleCharacterLimitControl() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();

  return (
    <Input
      type="number"
      min="10"
      max="200"
      value={titleGeneration.characterLimit}
      onChange={(event) =>
        updateTitleGeneration({ characterLimit: parseInt(event.target.value) || 50 })
      }
      aria-label="Character limit"
      className="w-full md:w-32"
    />
  );
}

export function TitleCustomPhrase() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();
  const field =
    titleGeneration.method === "ai" && !titleGeneration.fallbackMethod
      ? "fallbackPhrase"
      : "customPhrase";

  return (
    <SettingsRow
      label="Custom Phrase"
      htmlFor="custom-phrase"
      description={
        titleGeneration.method === "custom"
          ? "The phrase to use as the chat title."
          : "Shown while the AI title is generating and kept if generation fails."
      }
    >
      <Input
        id="custom-phrase"
        value={titleGeneration[field]}
        onChange={(event) => updateTitleGeneration({ [field]: event.target.value })}
        placeholder="New chat"
        className="w-full md:w-64"
      />
    </SettingsRow>
  );
}

export function TitleFallbackPhraseControl() {
  const [titleGeneration, updateTitleGeneration] = useTitleGeneration();

  return (
    <Input
      value={titleGeneration.fallbackPhrase}
      onChange={(event) => updateTitleGeneration({ fallbackPhrase: event.target.value })}
      placeholder="New chat"
      aria-label="Fallback phrase"
      className="w-full md:w-64"
    />
  );
}
