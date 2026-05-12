import { IconCheck, IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback } from "react";

import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  collapsedSidebarLayoutAtom,
  colorThemeAtom,
  fontAtom,
  inputStyleAtom,
  markdownHighlightingAtom,
  roundnessAtom,
  textScaleAtom,
  uiTintAtom,
  uiTintStrengthAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  type CollapsedSidebarLayoutOption,
  DEFAULT_SETTINGS,
  type InputStyleOption,
} from "@/lib/settings/types";
import { cn } from "@/lib/utils";

const roundnessOptions = [
  { value: "none", label: "Not Round", radius: "rounded-[0px]" },
  { value: "sm", label: "Slightly Round", radius: "rounded-[0.3125rem]" },
  { value: "md", label: "Round", radius: "rounded-[0.625rem]" },
  { value: "lg", label: "Very Round", radius: "rounded-[1.25rem]" },
] as const;

const fontOptions = [
  { value: "default", label: "Default", className: "font-space-grotesk" },
  { value: "system", label: "System", className: "font-sans" },
  { value: "mono", label: "Mono", className: "font-mono" },
  { value: "roboto", label: "Roboto", className: "font-roboto" },
] as const;

const textScaleOptions = [
  { value: "xs", label: "Tiny" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Default" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Huge" },
  { value: "2xl", label: "Gigantic" },
] as const;

const colorThemeOptions = [
  {
    value: "default",
    label: "Default",
    className:
      "bg-[oklch(0.205_0_0)] dark:bg-[oklch(0.922_0_0)] hover:bg-[oklch(0.205_0_0)] dark:hover:bg-[oklch(0.922_0_0)] text-white dark:text-black",
  },
  {
    value: "red",
    label: "Red",
    className:
      "bg-[oklch(0.577_0.245_27.325)] dark:bg-[oklch(0.637_0.237_25.331)] hover:bg-[oklch(0.577_0.245_27.325)] dark:hover:bg-[oklch(0.637_0.237_25.331)] text-white",
  },
  {
    value: "blue",
    label: "Blue",
    className:
      "bg-[oklch(0.488_0.243_264.376)] dark:bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.488_0.243_264.376)] dark:hover:bg-[oklch(0.488_0.243_264.376)] text-white",
  },
  {
    value: "yellow",
    label: "Yellow",
    className:
      "bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)] hover:bg-[oklch(0.852_0.199_91.936)] dark:hover:bg-[oklch(0.795_0.184_86.047)] text-black",
  },
  {
    value: "green",
    label: "Green",
    className:
      "bg-[oklch(0.648_0.2_131.684)] dark:bg-[oklch(0.648_0.2_131.684)] hover:bg-[oklch(0.648_0.2_131.684)] dark:hover:bg-[oklch(0.648_0.2_131.684)] text-white",
  },
  {
    value: "orange",
    label: "Orange",
    className:
      "bg-[oklch(0.646_0.222_41.116)] dark:bg-[oklch(0.705_0.213_47.604)] hover:bg-[oklch(0.646_0.222_41.116)] dark:hover:bg-[oklch(0.705_0.213_47.604)] text-white",
  },
  {
    value: "rose",
    label: "Rose",
    className:
      "bg-[oklch(0.586_0.253_17.585)] dark:bg-[oklch(0.645_0.246_16.439)] hover:bg-[oklch(0.586_0.253_17.585)] dark:hover:bg-[oklch(0.645_0.246_16.439)] text-white",
  },
  {
    value: "violet",
    label: "Violet",
    className:
      "bg-[oklch(0.541_0.281_293.009)] dark:bg-[oklch(0.606_0.25_292.717)] hover:bg-[oklch(0.541_0.281_293.009)] dark:hover:bg-[oklch(0.606_0.25_292.717)] text-white",
  },
];

export default function AppearanceSection() {
  const [colorTheme, setColorTheme] = useAtom(colorThemeAtom);
  const [font, setFont] = useAtom(fontAtom);
  const [roundness, setRoundness] = useAtom(roundnessAtom);
  const [textScale, setTextScale] = useAtom(textScaleAtom);
  const [uiTint, setUiTint] = useAtom(uiTintAtom);
  const [uiTintStrength, setUiTintStrength] = useAtom(uiTintStrengthAtom);
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(markdownHighlightingAtom);
  const [inputStyle, setInputStyle] = useAtom(inputStyleAtom);
  const [collapsedSidebarLayout, setCollapsedSidebarLayout] = useAtom(collapsedSidebarLayoutAtom);

  const activeColorRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      node.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, []);

  const isMarkdownHighlightingDefault =
    markdownHighlighting === DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING;
  const isUiTintStrengthDefault = uiTintStrength === DEFAULT_SETTINGS.UI_TINT_STRENGTH;
  const isInputStyleDefault = inputStyle === DEFAULT_SETTINGS.INPUT_STYLE;
  const isCollapsedSidebarLayoutDefault =
    collapsedSidebarLayout === DEFAULT_SETTINGS.COLLAPSED_SIDEBAR_LAYOUT;

  const handleResetMarkdownHighlighting = () => {
    trackSettingsInteraction("appearance", "reset_markdown_highlighting");
    resetSetting("MARKDOWN_HIGHLIGHTING");
  };

  const handleResetInputStyle = () => {
    trackSettingsInteraction("appearance", "reset_input_style");
    resetSetting("INPUT_STYLE");
  };

  const handleResetCollapsedSidebarLayout = () => {
    trackSettingsInteraction("appearance", "reset_collapsed_sidebar_layout");
    resetSetting("COLLAPSED_SIDEBAR_LAYOUT");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>General Look and Feel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Theme</Label>
            </div>
            <ThemeToggle className="md:max-w-64" />
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Primary Color</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Controls the accent color used for switches, badges, highlights, and primary
                actions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ScrollArea className="max-w-full md:max-w-64">
                <ScrollBar className="w-full" orientation="horizontal" />
                <div className="flex flex-row flex-nowrap gap-2">
                  {colorThemeOptions.map((option) => (
                    <Button
                      key={option.value}
                      ref={colorTheme === option.value ? activeColorRef : undefined}
                      onClick={() => {
                        trackSettingsInteraction("appearance", "primary_color_changed", {
                          value: option.value,
                        });
                        setColorTheme(option.value as typeof colorTheme);
                      }}
                      size="icon"
                      className={cn("border-foreground rounded-md border-0", option.className)}
                      title={option.label}
                    >
                      {colorTheme === option.value && <IconCheck data-icon="inline-start" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Tint</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Adds a subtle color wash to surfaces like backgrounds, panels, sidebars, and muted
                buttons.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ScrollArea className="max-w-full md:max-w-64">
                <ScrollBar className="w-full" orientation="horizontal" />
                <div className="flex flex-row flex-nowrap gap-2">
                  {colorThemeOptions.map((option) => (
                    <Button
                      key={option.value}
                      ref={uiTint === option.value ? activeColorRef : undefined}
                      onClick={() => {
                        trackSettingsInteraction("appearance", "tint_changed", {
                          value: option.value,
                        });
                        setUiTint(option.value as typeof uiTint);
                      }}
                      size="icon"
                      className={cn("border-foreground rounded-md border-0", option.className)}
                      title={option.label}
                    >
                      {uiTint === option.value && <IconCheck data-icon="inline-start" />}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium tabular-nums">
                  Tint Strength: {uiTintStrength}/10
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Choose how light or strong the tint should feel.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  trackSettingsInteraction("appearance", "reset_tint_strength");
                  resetSetting("UI_TINT_STRENGTH");
                }}
                disabled={isUiTintStrengthDefault}
                aria-label="Reset tint strength to default"
              >
                <IconRestore data-icon="inline-start" />
              </Button>
            </div>
            <Slider
              value={[uiTintStrength]}
              onValueChange={(value) => {
                trackSettingsInteraction("appearance", "tint_strength_changed", {
                  value: value[0],
                });
                setUiTintStrength(value[0] as typeof uiTintStrength);
              }}
              min={1}
              max={10}
              step={1}
              className="w-full"
              aria-label="Tint strength"
              disabled={uiTint === "default"}
            />
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Font</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose the font for the application.
              </p>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              value={font}
              onValueChange={(value) => {
                if (value) {
                  trackSettingsInteraction("appearance", "font_changed", { value });
                  setFont(value as typeof font);
                }
              }}
              aria-label="Select font"
              className="w-full min-w-64 md:w-fit"
            >
              {fontOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  className={option.className}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Roundness</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Adjust the corner radius of UI elements.
              </p>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              value={roundness}
              onValueChange={(value) => {
                if (value) {
                  trackSettingsInteraction("appearance", "roundness_changed", { value });
                  setRoundness(value as typeof roundness);
                }
              }}
              aria-label="Select roundness"
              className="w-full md:w-fit"
              size="lg"
            >
              {roundnessOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={option.label}
                  title={option.label}
                  size="lg"
                  className="size-16"
                >
                  <div className={cn("bg-primary size-10", option.radius)} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium">Text Scale</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Adjust the text size throughout the application.
              </p>
            </div>
            <div className="w-full md:max-w-64">
              <Select
                value={textScale}
                onValueChange={(value) => {
                  trackSettingsInteraction("appearance", "text_scale_changed", { value });
                  setTextScale(value as typeof textScale);
                }}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select text scale"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {textScaleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Markdown Highlighting</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Show markdown formatting styles while typing in the chat input.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={markdownHighlighting}
                onCheckedChange={(checked) => {
                  trackSettingsInteraction("appearance", "markdown_highlighting_toggled", {
                    enabled: checked,
                  });
                  setMarkdownHighlighting(checked);
                }}
                aria-label="Toggle markdown highlighting"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetMarkdownHighlighting}
                disabled={isMarkdownHighlightingDefault}
                aria-label="Reset to default"
              >
                <IconRestore data-icon="inline-start" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Input Style</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose how the chat input box is displayed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={inputStyle}
                onValueChange={(value) => {
                  trackSettingsInteraction("appearance", "input_style_changed", { value });
                  setInputStyle(value as InputStyleOption);
                }}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select input style"
                >
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="docked">Docked</SelectItem>
                    <SelectItem value="floating">Floating</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetInputStyle}
                disabled={isInputStyleDefault}
                aria-label="Reset to default"
              >
                <IconRestore data-icon="inline-start" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Collapsed Sidebar Layout</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose whether collapsed sidebar buttons are laid out in a row or column.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={collapsedSidebarLayout}
                onValueChange={(value) => {
                  trackSettingsInteraction("appearance", "collapsed_sidebar_layout_changed", {
                    value,
                  });
                  setCollapsedSidebarLayout(value as CollapsedSidebarLayoutOption);
                }}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select collapsed sidebar layout"
                >
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="row">Row</SelectItem>
                    <SelectItem value="column">Column</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetCollapsedSidebarLayout}
                disabled={isCollapsedSidebarLayoutDefault}
                aria-label="Reset to default"
              >
                <IconRestore data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
