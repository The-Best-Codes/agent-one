import { IconRestore } from "@tabler/icons-react";
import { deepEqual } from "fast-equals";
import { type Atom, atom, useAtom, useAtomValue } from "jotai";
import { RESET } from "jotai/utils";
import { type ComponentProps, type ReactNode, useState } from "react";

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
import { type SettingAtom, settingAtoms } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS, SETTINGS, type SettingKey } from "@/lib/settings/definitions";
import { cn } from "@/lib/utils";

export type SettingsLayout = "row" | "responsive" | "slider" | "stacked";

function useSetting(settingKey: SettingKey) {
  return useAtom(settingAtoms[settingKey] as SettingAtom<unknown>);
}

export function ResetButton({ settingKey }: { settingKey: SettingKey }) {
  const [value, setValue] = useSetting(settingKey);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setValue(RESET)}
      disabled={deepEqual(value, DEFAULT_SETTINGS[settingKey])}
      aria-label={`Reset ${SETTINGS[settingKey].label ?? "setting"} to default`}
    >
      <IconRestore />
    </Button>
  );
}

interface SettingsRowProps {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  layout?: SettingsLayout;
  action?: ReactNode;
  children?: ReactNode;
}

export function SettingsRow({
  label,
  description,
  htmlFor,
  layout = "responsive",
  action,
  children,
}: SettingsRowProps) {
  const heading = (
    <div className="flex flex-1 flex-col items-start">
      <Label htmlFor={htmlFor} className="text-sm font-medium tabular-nums">
        {label}
      </Label>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
    </div>
  );

  if (layout === "stacked") {
    return (
      <div className="flex flex-col gap-2">
        {heading}
        {children}
      </div>
    );
  }

  if (layout === "slider") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          {heading}
          {action}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex justify-between gap-2",
        layout === "row"
          ? "flex-row items-center"
          : "flex-col items-start md:flex-row md:items-center",
      )}
    >
      {heading}
      <div className="flex items-center gap-2">
        {children}
        {action}
      </div>
    </div>
  );
}

const neverAtom = atom(false);

export function SliderLabel({ settingKey }: { settingKey: SettingKey }) {
  const [value] = useSetting(settingKey);
  const definition = SETTINGS[settingKey];

  return `${definition.label}: ${String(value)}${"unit" in definition ? definition.unit : ""}`;
}

type NumberInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "onBlur" | "min" | "max"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
};

export function NumberInput({
  value,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  integer = false,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const parse = (text: string) => {
    const parsed = text.trim() === "" ? NaN : Number(text);
    return Number.isFinite(parsed) ? (integer ? Math.trunc(parsed) : parsed) : null;
  };

  const commit = (nextValue: number) => {
    if (nextValue !== value) onValueChange(nextValue);
  };

  return (
    <Input
      {...props}
      type="number"
      min={Number.isFinite(min) ? min : undefined}
      max={Number.isFinite(max) ? max : undefined}
      value={draft ?? value}
      onChange={(event) => {
        setDraft(event.target.value);
        const parsed = parse(event.target.value);
        if (parsed !== null && parsed >= min && parsed <= max) commit(parsed);
      }}
      onBlur={() => {
        const parsed = draft === null ? null : parse(draft);
        if (parsed !== null) commit(Math.min(max, Math.max(min, parsed)));
        setDraft(null);
      }}
    />
  );
}

interface SettingControlProps {
  settingKey: SettingKey;
  id: string;
  disabledAtom?: Atom<boolean>;
}

export function SettingControl({ settingKey, id, disabledAtom = neverAtom }: SettingControlProps) {
  const [value, setValue] = useSetting(settingKey);
  const disabled = useAtomValue(disabledAtom);
  const definition = SETTINGS[settingKey];

  switch (definition.control) {
    case "switch":
      return (
        <Switch id={id} checked={value as boolean} onCheckedChange={setValue} disabled={disabled} />
      );
    case "select":
      return (
        <Select value={value as string} onValueChange={setValue} disabled={disabled}>
          <SelectTrigger id={id} className="w-full md:w-fit md:max-w-96">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Object.entries(definition.options).map(([option, label]) => (
                <SelectItem key={option} value={option}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    case "number":
      return (
        <NumberInput
          id={id}
          value={value as number}
          onValueChange={setValue}
          min={definition.min}
          max={definition.max}
          integer
          disabled={disabled}
          className="w-full md:w-32"
        />
      );
    case "slider":
      return (
        <Slider
          id={id}
          value={[value as number]}
          onValueChange={([nextValue]) => setValue(nextValue)}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          disabled={disabled}
          aria-label={definition.label}
        />
      );
    case "text": {
      const text = value as string;
      const updateText = (nextText: string) =>
        setValue(definition.maxLength ? nextText.slice(0, definition.maxLength) : nextText);

      if (!definition.multiline) {
        return (
          <Input
            id={id}
            value={text}
            onChange={(event) => updateText(event.target.value)}
            placeholder={definition.placeholder}
            disabled={disabled}
          />
        );
      }

      return (
        <div className="relative">
          <Textarea
            id={id}
            value={text}
            onChange={(event) => updateText(event.target.value)}
            placeholder={definition.placeholder}
            disabled={disabled}
            className="field-sizing-fixed max-h-96 min-h-15 resize-y"
          />
          {definition.maxLength && (
            <span className="text-muted-foreground pointer-events-none absolute right-2 bottom-2 text-xs">
              {text.length} / {definition.maxLength}
            </span>
          )}
        </div>
      );
    }
    case "data":
      return null;
  }
}
