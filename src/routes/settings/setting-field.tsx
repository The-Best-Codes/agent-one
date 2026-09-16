import { IconRestore } from "@tabler/icons-react";
import { atom, useAtomValue, useStore, type WritableAtom } from "jotai";
import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  getSettingDefaultValue,
  getValueAtPath,
  setValueAtPath,
  type ResolvedSetting,
  type SettingControl,
  type SettingVisibility,
} from "@/lib/settings/registry";
import { resetSetting } from "@/lib/settings/reset-settings";

import { getCustomSettingComponent } from "./custom-components";
import { ColorSelectControl, ThemeSelectControl, ToggleSelectControl } from "./setting-controls";
import SettingsTarget from "./settings-target";

const EMPTY_ATOM = atom<undefined>(undefined);

function matchesVisibility(condition: SettingVisibility, value: unknown): boolean {
  const current = condition.path ? getValueAtPath(value, condition.path) : value;

  if (condition.equals !== undefined) return current === condition.equals;
  if (condition.notEquals !== undefined) return current !== condition.notEquals;
  if (condition.oneOf) return condition.oneOf.includes(current);
  return Boolean(current);
}

function defaultLayout(control: SettingControl): "inline" | "stacked" {
  switch (control.type) {
    case "slider":
    case "custom":
      return "stacked";
    case "text":
      return control.multiline ? "stacked" : "inline";
    default:
      return "inline";
  }
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

export default function SettingField({ setting }: { setting: ResolvedSetting }) {
  const { definition, group, section } = setting;
  const control = definition.control;
  const path = definition.path ?? [];
  const store = useStore();
  const rawValue = useAtomValue(definition.atom ?? EMPTY_ATOM);
  const conditionValue = useAtomValue(definition.visibleWhen?.atom ?? EMPTY_ATOM);
  const { user } = useWebAuth();
  const [numberDraft, setNumberDraft] = useState<string | null>(null);

  if (definition.visibleWhen && !matchesVisibility(definition.visibleWhen, conditionValue)) {
    return null;
  }

  const value = path.length > 0 ? getValueAtPath(rawValue, path) : rawValue;
  const defaultValue = getSettingDefaultValue(definition);
  const canReset =
    Boolean(definition.key) &&
    path.length === 0 &&
    control.type !== "custom" &&
    Boolean(definition.atom);
  const isDefault = canReset && value === defaultValue;
  const eventName = definition.id.replace(/-/g, "_");
  const layout = control.layout ?? defaultLayout(control);
  const controlId = `${definition.id}-control`;

  const track = (params?: Record<string, string | number | boolean>) =>
    trackSettingsInteraction(section, `${eventName}_changed`, params);

  const writeValue = (next: unknown) => {
    const target = definition.atom;
    if (!target) return;

    const writable = target as WritableAtom<unknown, [unknown], unknown>;
    if (path.length === 0) {
      store.set(writable, next);
      return;
    }

    store.set(writable, setValueAtPath(store.get(target), path, next));
  };

  const renderCustomComponent = (componentId: NonNullable<SettingControl["componentId"]>) => {
    const CustomComponent = getCustomSettingComponent(componentId);
    return <CustomComponent group={group} setting={definition} />;
  };

  const renderControl = () => {
    if (control.type === "custom") {
      return renderCustomComponent(control.componentId);
    }

    if (control.componentId) {
      return renderCustomComponent(control.componentId);
    }

    switch (control.type) {
      case "switch": {
        const signedOut = Boolean(control.signedOutHint) && !user;
        const toggle = (
          <Switch
            id={controlId}
            checked={Boolean(value)}
            onCheckedChange={(checked) => {
              track({ enabled: checked });
              writeValue(checked);
            }}
            disabled={signedOut}
            aria-label={definition.title}
          />
        );

        if (!control.signedOutHint) return toggle;

        return (
          <AdaptiveTooltip>
            <AdaptiveTooltipTrigger asChild>
              <span>{toggle}</span>
            </AdaptiveTooltipTrigger>
            {!user && <AdaptiveTooltipContent>{control.signedOutHint}</AdaptiveTooltipContent>}
          </AdaptiveTooltip>
        );
      }

      case "select": {
        if (control.appearance === "toggle") {
          return (
            <ToggleSelectControl
              options={control.options}
              value={typeof value === "string" || typeof value === "number" ? value : ""}
              ariaLabel={definition.title}
              onValueChange={(next) => {
                track({ value: next });
                writeValue(next);
              }}
            />
          );
        }

        if (control.appearance === "color") {
          return (
            <ColorSelectControl
              label={definition.title}
              options={control.options}
              value={typeof value === "string" ? value : ""}
              onValueChange={(next) => {
                track({ value: next });
                writeValue(next);
              }}
            />
          );
        }

        if (control.appearance === "theme") {
          return <ThemeSelectControl />;
        }

        return (
          <Select
            value={value === undefined || value === null ? "" : String(value)}
            onValueChange={(next) => {
              const option = control.options.find((candidate) => String(candidate.value) === next);
              if (!option) return;
              track({ value: option.value });
              writeValue(option.value);
            }}
          >
            <SelectTrigger
              id={controlId}
              className="w-full md:w-fit md:max-w-96"
              aria-label={`Select ${definition.title.toLowerCase()}`}
            >
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {control.options.map((option) => (
                  <SelectItem
                    key={String(option.value)}
                    value={String(option.value)}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      }

      case "slider": {
        const storedValue = typeof value === "number" ? value : control.min;
        const numericValue = value === control.minValue ? control.min : storedValue;

        return (
          <Slider
            id={controlId}
            value={[numericValue]}
            min={control.min}
            max={control.max}
            step={control.step}
            className="w-full"
            aria-label={definition.title}
            onValueChange={([next]) => {
              track({ value: next });
              writeValue(
                next === control.min && control.minValue !== undefined ? control.minValue : next,
              );
            }}
          />
        );
      }

      case "number": {
        const display = numberDraft ?? (typeof value === "number" ? String(value) : "");

        return (
          <Input
            id={controlId}
            type="number"
            min={control.min}
            max={control.max}
            value={display}
            className="w-full md:w-32"
            onChange={(event) => {
              setNumberDraft(event.target.value);
              const parsed = Number.parseInt(event.target.value, 10);
              if (Number.isNaN(parsed)) return;
              const next = clamp(parsed, control.min, control.max);
              track({ value: next });
              writeValue(next);
            }}
            onBlur={() => setNumberDraft(null)}
          />
        );
      }

      case "text": {
        const textValue = typeof value === "string" ? value : "";
        const handleChange = (next: string) => {
          const limited = control.maxLength !== undefined ? next.slice(0, control.maxLength) : next;
          track({ value_length: limited.length });
          writeValue(limited);
        };

        if (control.multiline) {
          return (
            <div className="relative">
              <Textarea
                id={controlId}
                value={textValue}
                placeholder={control.placeholder}
                onChange={(event) => handleChange(event.target.value)}
                className="field-sizing-fixed max-h-96 min-h-15 resize-y"
              />

              {control.maxLength !== undefined && (
                <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
                  {textValue.length} / {control.maxLength}
                </span>
              )}
            </div>
          );
        }

        return (
          <Input
            id={controlId}
            type="text"
            value={textValue}
            placeholder={control.placeholder}
            onChange={(event) => handleChange(event.target.value)}
            className="w-full md:w-64"
          />
        );
      }
    }
  };

  const resetButton = canReset ? (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        trackSettingsInteraction(section, `reset_${eventName}`);
        if (definition.key) resetSetting(definition.key);
      }}
      disabled={isDefault}
      aria-label={`Reset ${definition.title} to default`}
    >
      <IconRestore data-icon="inline-start" />
    </Button>
  ) : null;

  const details = (
    <>
      {definition.description && (
        <p className="text-muted-foreground mt-1 text-sm">{definition.description}</p>
      )}
      {definition.docs && (
        <a
          href={definition.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex w-fit text-sm underline"
        >
          Learn more
        </a>
      )}
    </>
  );

  if (layout === "stacked") {
    const numericValue =
      typeof value === "number" ? value : control.type === "slider" ? control.min : undefined;
    const displayValue =
      control.type === "slider"
        ? (control.formatValue?.(numericValue ?? control.min) ??
          `${numericValue ?? control.min}${control.unit ?? ""}`)
        : undefined;

    return (
      <SettingsTarget id={`setting-${definition.id}`}>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label>
                {displayValue ? `${definition.title}: ${displayValue}` : definition.title}
              </Label>
              {details}
            </div>
            {resetButton}
          </div>
          {renderControl()}
        </div>
      </SettingsTarget>
    );
  }

  return (
    <SettingsTarget id={`setting-${definition.id}`}>
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col items-start">
          <Label htmlFor={controlId}>{definition.title}</Label>
          {details}
        </div>
        <div className="flex items-center gap-2">
          {renderControl()}
          {resetButton}
        </div>
      </div>
    </SettingsTarget>
  );
}
