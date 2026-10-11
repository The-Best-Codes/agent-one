import { useAtom } from "jotai";

import { ColorPicker } from "@/components/a1/color-picker";
import ThemeToggle from "@/components/theme/toggle-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { SETTINGS, type SettingValue } from "@/lib/settings/definitions";
import { cn } from "@/lib/utils";

const COLOR_CLASSES: Record<SettingValue<"COLOR_THEME">, string> = {
  default:
    "bg-[oklch(0.205_0_0)] dark:bg-[oklch(0.922_0_0)] hover:bg-[oklch(0.205_0_0)] dark:hover:bg-[oklch(0.922_0_0)] text-white dark:text-black",
  amber:
    "bg-[oklch(0.555_0.163_48.998)] dark:bg-[oklch(0.473_0.137_46.201)] hover:bg-[oklch(0.555_0.163_48.998)] dark:hover:bg-[oklch(0.473_0.137_46.201)] text-white",
  blue: "bg-[oklch(0.488_0.243_264.376)] dark:bg-[oklch(0.424_0.199_265.638)] hover:bg-[oklch(0.488_0.243_264.376)] dark:hover:bg-[oklch(0.424_0.199_265.638)] text-white",
  cyan: "bg-[oklch(0.52_0.105_223.128)] dark:bg-[oklch(0.45_0.085_224.283)] hover:bg-[oklch(0.52_0.105_223.128)] dark:hover:bg-[oklch(0.45_0.085_224.283)] text-white",
  emerald:
    "bg-[oklch(0.508_0.118_165.612)] dark:bg-[oklch(0.432_0.095_166.913)] hover:bg-[oklch(0.508_0.118_165.612)] dark:hover:bg-[oklch(0.432_0.095_166.913)] text-white",
  fuchsia:
    "bg-[oklch(0.518_0.253_323.949)] dark:bg-[oklch(0.452_0.211_324.591)] hover:bg-[oklch(0.518_0.253_323.949)] dark:hover:bg-[oklch(0.452_0.211_324.591)] text-white",
  green:
    "bg-[oklch(0.527_0.154_150.069)] dark:bg-[oklch(0.448_0.119_151.328)] hover:bg-[oklch(0.527_0.154_150.069)] dark:hover:bg-[oklch(0.448_0.119_151.328)] text-white",
  indigo:
    "bg-[oklch(0.457_0.24_277.023)] dark:bg-[oklch(0.398_0.195_277.366)] hover:bg-[oklch(0.457_0.24_277.023)] dark:hover:bg-[oklch(0.398_0.195_277.366)] text-white",
  lime: "bg-[oklch(0.841_0.238_128.85)] dark:bg-[oklch(0.768_0.233_130.85)] hover:bg-[oklch(0.841_0.238_128.85)] dark:hover:bg-[oklch(0.768_0.233_130.85)] text-black",
  orange:
    "bg-[oklch(0.553_0.195_38.402)] dark:bg-[oklch(0.47_0.157_37.304)] hover:bg-[oklch(0.553_0.195_38.402)] dark:hover:bg-[oklch(0.47_0.157_37.304)] text-white",
  pink: "bg-[oklch(0.525_0.223_3.958)] dark:bg-[oklch(0.459_0.187_3.815)] hover:bg-[oklch(0.525_0.223_3.958)] dark:hover:bg-[oklch(0.459_0.187_3.815)] text-white",
  purple:
    "bg-[oklch(0.496_0.265_301.924)] dark:bg-[oklch(0.438_0.218_303.724)] hover:bg-[oklch(0.496_0.265_301.924)] dark:hover:bg-[oklch(0.438_0.218_303.724)] text-white",
  red: "bg-[oklch(0.505_0.213_27.518)] dark:bg-[oklch(0.444_0.177_26.899)] hover:bg-[oklch(0.505_0.213_27.518)] dark:hover:bg-[oklch(0.444_0.177_26.899)] text-white",
  rose: "bg-[oklch(0.514_0.222_16.935)] dark:bg-[oklch(0.455_0.188_13.697)] hover:bg-[oklch(0.514_0.222_16.935)] dark:hover:bg-[oklch(0.455_0.188_13.697)] text-white",
  sky: "bg-[oklch(0.5_0.134_242.749)] dark:bg-[oklch(0.443_0.11_240.79)] hover:bg-[oklch(0.5_0.134_242.749)] dark:hover:bg-[oklch(0.443_0.11_240.79)] text-white",
  teal: "bg-[oklch(0.511_0.096_186.391)] dark:bg-[oklch(0.437_0.078_188.216)] hover:bg-[oklch(0.511_0.096_186.391)] dark:hover:bg-[oklch(0.437_0.078_188.216)] text-white",
  violet:
    "bg-[oklch(0.491_0.27_292.581)] dark:bg-[oklch(0.432_0.232_292.759)] hover:bg-[oklch(0.491_0.27_292.581)] dark:hover:bg-[oklch(0.432_0.232_292.759)] text-white",
  yellow:
    "bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)] hover:bg-[oklch(0.852_0.199_91.936)] dark:hover:bg-[oklch(0.795_0.184_86.047)] text-black",
};

const COLOR_PICKER_OPTIONS = Object.entries(SETTINGS.COLOR_THEME.options).map(([value, label]) => ({
  value,
  label,
  className: COLOR_CLASSES[value as SettingValue<"COLOR_THEME">],
}));

const FONT_CLASSES: Record<SettingValue<"FONT">, string> = {
  default: "font-space-grotesk",
  system: "font-sans",
  mono: "font-mono",
  roboto: "font-roboto",
};

const ROUNDNESS_CLASSES: Record<SettingValue<"ROUNDNESS">, string> = {
  none: "rounded-[0px]",
  sm: "rounded-[0.3125rem]",
  md: "rounded-[0.625rem]",
  lg: "rounded-[1.25rem]",
};

export function ThemeControl() {
  return <ThemeToggle className="md:justify-end" />;
}

export function ColorThemeControl() {
  const [colorTheme, setColorTheme] = useAtom(settingAtoms.COLOR_THEME);

  return (
    <ColorPicker
      label="Primary color"
      value={colorTheme}
      onValueChange={(value) => setColorTheme(value as typeof colorTheme)}
      options={COLOR_PICKER_OPTIONS}
    />
  );
}

export function TintControl() {
  const [uiTint, setUiTint] = useAtom(settingAtoms.UI_TINT);

  return (
    <ColorPicker
      label="Tint"
      value={uiTint}
      onValueChange={(value) => setUiTint(value as typeof uiTint)}
      options={COLOR_PICKER_OPTIONS}
    />
  );
}

export function FontControl() {
  const [font, setFont] = useAtom(settingAtoms.FONT);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={font}
      onValueChange={(value) => {
        if (value) setFont(value as typeof font);
      }}
      aria-label="Select font"
      className="w-full min-w-64 md:w-fit"
    >
      {Object.entries(SETTINGS.FONT.options).map(([value, label]) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className={FONT_CLASSES[value as typeof font]}
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function RoundnessControl() {
  const [roundness, setRoundness] = useAtom(settingAtoms.ROUNDNESS);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={roundness}
      onValueChange={(value) => {
        if (value) setRoundness(value as typeof roundness);
      }}
      aria-label="Select roundness"
      className="w-full md:w-fit"
      size="lg"
    >
      {Object.entries(SETTINGS.ROUNDNESS.options).map(([value, label]) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          title={label}
          size="lg"
          className="size-16"
        >
          <div className={cn("bg-primary size-10", ROUNDNESS_CLASSES[value as typeof roundness])} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
