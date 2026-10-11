import { IconRestore } from "@tabler/icons-react";
import { deepEqual } from "fast-equals";
import { type Atom, atom, useAtom, useAtomValue } from "jotai";
import { RESET } from "jotai/utils";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  DEFAULT_SETTINGS,
  SETTINGS,
  type SettingDefinition,
  type SettingKey,
} from "@/lib/settings/definitions";
import { cn } from "@/lib/utils";

import {
  type SettingsCard,
  type SettingsItem,
  type SettingsLayout,
  SETTINGS_SECTIONS,
} from "./settings-schema";
import { SettingsTarget } from "./settings-target";

const alwaysAtom = atom(true);
const neverAtom = atom(false);

const DEFAULT_LAYOUTS: Record<SettingDefinition["control"], SettingsLayout> = {
  switch: "row",
  select: "responsive",
  number: "responsive",
  slider: "slider",
  text: "stacked",
  data: "responsive",
};

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

function SliderLabel({ settingKey }: { settingKey: SettingKey }) {
  const [value] = useSetting(settingKey);
  const definition = SETTINGS[settingKey];

  return `${definition.label}: ${String(value)}${"unit" in definition ? definition.unit : ""}`;
}

interface SettingControlProps {
  settingKey: SettingKey;
  id: string;
  disabledAtom?: Atom<boolean>;
}

function SettingControl({ settingKey, id, disabledAtom = neverAtom }: SettingControlProps) {
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
        <Input
          id={id}
          type="number"
          min={definition.min}
          max={definition.max}
          value={value as number}
          onChange={(event) => setValue(parseInt(event.target.value) || definition.default)}
          onBlur={() =>
            setValue(Math.min(definition.max, Math.max(definition.min, value as number)))
          }
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

function SettingsItemView({ item }: { item: SettingsItem }) {
  const visible = useAtomValue(item.visible ?? alwaysAtom);

  if (!visible) return null;

  if (item.render) {
    return (
      <SettingsTarget id={`setting-${item.id}`}>
        <item.render />
      </SettingsTarget>
    );
  }

  const definition = item.key ? SETTINGS[item.key] : undefined;
  const layout = item.layout ?? (definition ? DEFAULT_LAYOUTS[definition.control] : "responsive");
  const controlId = `${item.id}-control`;

  return (
    <SettingsTarget id={`setting-${item.id}`}>
      <SettingsRow
        label={
          item.key && definition?.control === "slider" ? (
            <SliderLabel settingKey={item.key} />
          ) : (
            (item.label ?? definition?.label)
          )
        }
        description={item.description ?? definition?.description}
        htmlFor={item.control ? undefined : controlId}
        layout={layout}
        action={item.key && layout !== "stacked" ? <ResetButton settingKey={item.key} /> : null}
      >
        {item.control ? (
          <item.control />
        ) : (
          item.key && (
            <SettingControl settingKey={item.key} id={controlId} disabledAtom={item.disabled} />
          )
        )}
      </SettingsRow>
    </SettingsTarget>
  );
}

function SettingsCardView({ card }: { card: SettingsCard }) {
  const visible = useAtomValue(card.visible ?? alwaysAtom);

  if (!visible) return null;

  const content = (
    <Card size={card.size}>
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
        {card.description && <CardDescription>{card.description}</CardDescription>}
        {card.resetKey && (
          <CardAction>
            <ResetButton settingKey={card.resetKey} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className={cn("flex flex-col", card.render ? "gap-4" : "gap-6")}>
        {card.render ? (
          <card.render />
        ) : (
          card.items?.map((item) => <SettingsItemView key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );

  return card.id ? <SettingsTarget id={`setting-${card.id}`}>{content}</SettingsTarget> : content;
}

export function SettingsSectionCards({ sectionId }: { sectionId: string }) {
  return SETTINGS_SECTIONS.find((section) => section.id === sectionId)?.cards.map((card) => (
    <SettingsCardView key={card.title} card={card} />
  ));
}

export function SettingsSections() {
  return SETTINGS_SECTIONS.map((section) => (
    <section
      key={section.id}
      id={`section-${section.id}`}
      aria-labelledby={`section-${section.id}-heading`}
      className="flex scroll-mt-20 flex-col gap-6 md:scroll-mt-6"
    >
      <h2 id={`section-${section.id}-heading`} className="text-xl font-semibold">
        {section.label}
      </h2>
      {section.intro && <section.intro />}
      {section.cards.map((card) => (
        <SettingsCardView key={card.title} card={card} />
      ))}
    </section>
  ));
}
