import { ColorPicker, type ColorPickerOption } from "@/components/a1/color-picker";
import ThemeToggle from "@/components/theme/toggle-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { SettingSelectOption } from "@/lib/settings/registry";
import type { ColorThemeOption } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

const colorSwatchClassNames = {
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
} satisfies Record<ColorThemeOption, string>;

function toColorPickerOptions(
  options: readonly SettingSelectOption[],
): readonly ColorPickerOption[] {
  return options.map((option) => {
    const value = String(option.value) as ColorThemeOption;
    return {
      value,
      label: option.label,
      className: colorSwatchClassNames[value] ?? colorSwatchClassNames.default,
    };
  });
}

export function ToggleSelectControl({
  options,
  value,
  onValueChange,
  ariaLabel,
}: {
  options: readonly SettingSelectOption[];
  value: string | number;
  onValueChange: (value: string | number) => void;
  ariaLabel: string;
}) {
  const hasSwatches = options.some((option) => option.swatchClassName);

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={String(value)}
      onValueChange={(next) => {
        const option = options.find((candidate) => String(candidate.value) === next);
        if (option) onValueChange(option.value);
      }}
      aria-label={ariaLabel}
      className={cn("w-full min-w-64 md:w-fit", hasSwatches && "gap-1")}
    >
      {options.map((option) =>
        option.swatchClassName ? (
          <ToggleGroupItem
            key={String(option.value)}
            value={String(option.value)}
            aria-label={option.label}
            title={option.label}
            size="lg"
            className="size-16"
          >
            <div className={cn("bg-primary size-10", option.swatchClassName)} />
          </ToggleGroupItem>
        ) : (
          <ToggleGroupItem
            key={String(option.value)}
            value={String(option.value)}
            aria-label={option.label}
            className={cn("flex-1 md:flex-none", option.itemClassName)}
          >
            {option.label}
          </ToggleGroupItem>
        ),
      )}
    </ToggleGroup>
  );
}

export function ColorSelectControl({
  options,
  label,
  value,
  onValueChange,
}: {
  options: readonly SettingSelectOption[];
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <ColorPicker
      label={label}
      value={value}
      onValueChange={onValueChange}
      options={toColorPickerOptions(options)}
    />
  );
}

export function ThemeSelectControl() {
  return <ThemeToggle className="md:justify-end" />;
}
