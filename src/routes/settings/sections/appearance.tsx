import { IconCheck, IconPhotoOff, IconPhotoPlus, IconRestore, IconX } from "@tabler/icons-react";
import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { useAtom } from "jotai";
import { type ComponentProps, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ColorPicker } from "@/components/a1/color-picker";
import { LanguagePicker } from "@/components/a1/language-picker";
import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  chatBackgroundPresets,
  cssImageUrl,
  resolveChatBackgroundAssetUrl,
} from "@/lib/chat-backgrounds";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  chatBackgroundAtom,
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
  type ChatBackgroundPresetOption,
  type CollapsedSidebarLayoutOption,
  DEFAULT_SETTINGS,
  type InputStyleOption,
} from "@/lib/settings/types";
import { cn } from "@/lib/utils";

import SettingsTarget from "../settings-target";

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
    value: "amber",
    label: "Amber",
    className:
      "bg-[oklch(0.555_0.163_48.998)] dark:bg-[oklch(0.473_0.137_46.201)] hover:bg-[oklch(0.555_0.163_48.998)] dark:hover:bg-[oklch(0.473_0.137_46.201)] text-white",
  },
  {
    value: "blue",
    label: "Blue",
    className:
      "bg-[oklch(0.488_0.243_264.376)] dark:bg-[oklch(0.424_0.199_265.638)] hover:bg-[oklch(0.488_0.243_264.376)] dark:hover:bg-[oklch(0.424_0.199_265.638)] text-white",
  },
  {
    value: "cyan",
    label: "Cyan",
    className:
      "bg-[oklch(0.52_0.105_223.128)] dark:bg-[oklch(0.45_0.085_224.283)] hover:bg-[oklch(0.52_0.105_223.128)] dark:hover:bg-[oklch(0.45_0.085_224.283)] text-white",
  },
  {
    value: "emerald",
    label: "Emerald",
    className:
      "bg-[oklch(0.508_0.118_165.612)] dark:bg-[oklch(0.432_0.095_166.913)] hover:bg-[oklch(0.508_0.118_165.612)] dark:hover:bg-[oklch(0.432_0.095_166.913)] text-white",
  },
  {
    value: "fuchsia",
    label: "Fuchsia",
    className:
      "bg-[oklch(0.518_0.253_323.949)] dark:bg-[oklch(0.452_0.211_324.591)] hover:bg-[oklch(0.518_0.253_323.949)] dark:hover:bg-[oklch(0.452_0.211_324.591)] text-white",
  },
  {
    value: "green",
    label: "Green",
    className:
      "bg-[oklch(0.527_0.154_150.069)] dark:bg-[oklch(0.448_0.119_151.328)] hover:bg-[oklch(0.527_0.154_150.069)] dark:hover:bg-[oklch(0.448_0.119_151.328)] text-white",
  },
  {
    value: "indigo",
    label: "Indigo",
    className:
      "bg-[oklch(0.457_0.24_277.023)] dark:bg-[oklch(0.398_0.195_277.366)] hover:bg-[oklch(0.457_0.24_277.023)] dark:hover:bg-[oklch(0.398_0.195_277.366)] text-white",
  },
  {
    value: "lime",
    label: "Lime",
    className:
      "bg-[oklch(0.841_0.238_128.85)] dark:bg-[oklch(0.768_0.233_130.85)] hover:bg-[oklch(0.841_0.238_128.85)] dark:hover:bg-[oklch(0.768_0.233_130.85)] text-black",
  },
  {
    value: "orange",
    label: "Orange",
    className:
      "bg-[oklch(0.553_0.195_38.402)] dark:bg-[oklch(0.47_0.157_37.304)] hover:bg-[oklch(0.553_0.195_38.402)] dark:hover:bg-[oklch(0.47_0.157_37.304)] text-white",
  },
  {
    value: "pink",
    label: "Pink",
    className:
      "bg-[oklch(0.525_0.223_3.958)] dark:bg-[oklch(0.459_0.187_3.815)] hover:bg-[oklch(0.525_0.223_3.958)] dark:hover:bg-[oklch(0.459_0.187_3.815)] text-white",
  },
  {
    value: "purple",
    label: "Purple",
    className:
      "bg-[oklch(0.496_0.265_301.924)] dark:bg-[oklch(0.438_0.218_303.724)] hover:bg-[oklch(0.496_0.265_301.924)] dark:hover:bg-[oklch(0.438_0.218_303.724)] text-white",
  },
  {
    value: "red",
    label: "Red",
    className:
      "bg-[oklch(0.505_0.213_27.518)] dark:bg-[oklch(0.444_0.177_26.899)] hover:bg-[oklch(0.505_0.213_27.518)] dark:hover:bg-[oklch(0.444_0.177_26.899)] text-white",
  },
  {
    value: "rose",
    label: "Rose",
    className:
      "bg-[oklch(0.514_0.222_16.935)] dark:bg-[oklch(0.455_0.188_13.697)] hover:bg-[oklch(0.514_0.222_16.935)] dark:hover:bg-[oklch(0.455_0.188_13.697)] text-white",
  },
  {
    value: "sky",
    label: "Sky",
    className:
      "bg-[oklch(0.5_0.134_242.749)] dark:bg-[oklch(0.443_0.11_240.79)] hover:bg-[oklch(0.5_0.134_242.749)] dark:hover:bg-[oklch(0.443_0.11_240.79)] text-white",
  },
  {
    value: "teal",
    label: "Teal",
    className:
      "bg-[oklch(0.511_0.096_186.391)] dark:bg-[oklch(0.437_0.078_188.216)] hover:bg-[oklch(0.511_0.096_186.391)] dark:hover:bg-[oklch(0.437_0.078_188.216)] text-white",
  },
  {
    value: "violet",
    label: "Violet",
    className:
      "bg-[oklch(0.491_0.27_292.581)] dark:bg-[oklch(0.432_0.232_292.759)] hover:bg-[oklch(0.491_0.27_292.581)] dark:hover:bg-[oklch(0.432_0.232_292.759)] text-white",
  },
  {
    value: "yellow",
    label: "Yellow",
    className:
      "bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)] hover:bg-[oklch(0.852_0.199_91.936)] dark:hover:bg-[oklch(0.795_0.184_86.047)] text-black",
  },
];

const CUSTOM_BACKGROUND_DIR = "chat-backgrounds";
const CUSTOM_BACKGROUND_IMAGE_DIR = `${CUSTOM_BACKGROUND_DIR}/images`;
const CUSTOM_BACKGROUND_THUMBNAIL_DIR = `${CUSTOM_BACKGROUND_DIR}/thumbnails`;
const chatBackgroundDefaults = DEFAULT_SETTINGS.CHAT_BACKGROUND;

type PendingCustomBackground = {
  url: string;
};

const ChatBackgroundSlider = ({
  label,
  value,
  defaultValue,
  suffix,
  onCommit,
  ...props
}: {
  label: string;
  value: number | undefined;
  defaultValue: number;
  suffix: string;
  onCommit: (value: number) => void;
} & Omit<
  ComponentProps<typeof Slider>,
  "defaultValue" | "value" | "onValueChange" | "onValueCommit"
>) => {
  const [draggingValue, setDraggingValue] = useState<number | null>(null);
  const displayValue = [draggingValue ?? value ?? defaultValue];

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm tabular-nums">
        {label}: {displayValue[0]}
        {suffix}
      </Label>
      <Slider
        value={displayValue}
        onValueChange={(nextValue) => setDraggingValue(nextValue[0])}
        onValueCommit={(nextValue) => {
          setDraggingValue(null);
          onCommit(nextValue[0]);
        }}
        {...props}
      />
    </div>
  );
};

function createCustomBackgroundId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function sanitizeExtension(extension: string) {
  const trimmed = extension.trim().toLowerCase();
  return trimmed && /^[a-z0-9]+$/.test(trimmed) ? trimmed : "jpg";
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to generate image blob."));
      },
      type,
      quality,
    );
  });
}

async function writeManagedFile(path: string, data: Uint8Array) {
  await writeFile(path, data, { baseDir: BaseDirectory.AppLocalData });
}

async function ensureCustomBackgroundDirs() {
  await mkdir(CUSTOM_BACKGROUND_IMAGE_DIR, {
    baseDir: BaseDirectory.AppLocalData,
    recursive: true,
  });
  await mkdir(CUSTOM_BACKGROUND_THUMBNAIL_DIR, {
    baseDir: BaseDirectory.AppLocalData,
    recursive: true,
  });
}

async function createThumbnailFile(sourceUrl: string, destinationPath: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = sourceUrl;

  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to create thumbnail canvas context.");
  }

  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

  const thumbnailBlob = await canvasToBlob(canvas, "image/jpeg", 0.72);
  const thumbnailBytes = new Uint8Array(await thumbnailBlob.arrayBuffer());

  await writeManagedFile(destinationPath, thumbnailBytes);
}

export default function AppearanceSection() {
  const { t } = useTranslation();
  const [chatBackground, setChatBackground] = useAtom(chatBackgroundAtom);
  const [colorTheme, setColorTheme] = useAtom(colorThemeAtom);
  const [font, setFont] = useAtom(fontAtom);
  const [roundness, setRoundness] = useAtom(roundnessAtom);
  const [textScale, setTextScale] = useAtom(textScaleAtom);
  const [uiTint, setUiTint] = useAtom(uiTintAtom);
  const [uiTintStrength, setUiTintStrength] = useAtom(uiTintStrengthAtom);
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(markdownHighlightingAtom);
  const [inputStyle, setInputStyle] = useAtom(inputStyleAtom);
  const [collapsedSidebarLayout, setCollapsedSidebarLayout] = useAtom(collapsedSidebarLayoutAtom);
  const [pendingCustomBackgrounds, setPendingCustomBackgrounds] = useState<
    PendingCustomBackground[]
  >([]);
  const [removingCustomUrl, setRemovingCustomUrl] = useState<string | null>(null);
  const addingCustomBackgroundRef = useRef(false);

  const isMarkdownHighlightingDefault =
    markdownHighlighting === DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING;
  const isUiTintStrengthDefault = uiTintStrength === DEFAULT_SETTINGS.UI_TINT_STRENGTH;
  const isChatBackgroundDefault =
    chatBackground.tint === chatBackgroundDefaults.tint &&
    chatBackground.blur === chatBackgroundDefaults.blur &&
    chatBackground.dim === chatBackgroundDefaults.dim &&
    (chatBackground.x ?? chatBackgroundDefaults.x) === chatBackgroundDefaults.x &&
    (chatBackground.y ?? chatBackgroundDefaults.y) === chatBackgroundDefaults.y &&
    (chatBackground.zoom ?? chatBackgroundDefaults.zoom) === chatBackgroundDefaults.zoom &&
    (chatBackground.backgroundShade ?? chatBackgroundDefaults.backgroundShade) ===
      chatBackgroundDefaults.backgroundShade;
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

  const updateChatBackground = (updates: Partial<typeof DEFAULT_SETTINGS.CHAT_BACKGROUND>) => {
    setChatBackground((prev) => ({ ...DEFAULT_SETTINGS.CHAT_BACKGROUND, ...prev, ...updates }));
  };

  const removeManagedBackgroundFile = async (url: string) => {
    const thumbnailUrl = chatBackground.customThumbnails?.[url];

    await Promise.all([
      remove(url).catch(() => undefined),
      thumbnailUrl ? remove(thumbnailUrl).catch(() => undefined) : Promise.resolve(undefined),
    ]);
  };

  const removeCustomBackground = (url: string) => {
    trackSettingsInteraction("appearance", "custom_chat_background_removed");
    void removeManagedBackgroundFile(url);
    setChatBackground((prev) => {
      const customUrls = (prev.customUrls ?? []).filter((customUrl) => customUrl !== url);
      const customThumbnails = { ...prev.customThumbnails };
      delete customThumbnails[url];
      const isRemovingActive = prev.preset === "custom" && prev.customUrl === url;

      return {
        ...DEFAULT_SETTINGS.CHAT_BACKGROUND,
        ...prev,
        customUrls,
        customThumbnails,
        customUrl: isRemovingActive ? "" : prev.customUrl,
        preset: isRemovingActive ? "none" : prev.preset,
      };
    });
    setPendingCustomBackgrounds((prev) => prev.filter((background) => background.url !== url));
  };

  const handleAddCustomBackground = async () => {
    if (addingCustomBackgroundRef.current) return;

    addingCustomBackgroundRef.current = true;

    try {
      const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: t("appearance.imageFilter"),
            extensions: ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"],
          },
        ],
      });

      if (typeof selectedPath !== "string") {
        return;
      }

      await ensureCustomBackgroundDirs();

      const extension = sanitizeExtension((await extname(selectedPath)).replace(/^\./, ""));
      const id = createCustomBackgroundId();
      const imageRelativePath = `${CUSTOM_BACKGROUND_IMAGE_DIR}/${id}.${extension}`;
      const thumbnailRelativePath = `${CUSTOM_BACKGROUND_THUMBNAIL_DIR}/${id}.jpg`;

      const imageBytes = await readFile(selectedPath);
      await writeManagedFile(imageRelativePath, imageBytes);

      const appLocalDataPath = await appLocalDataDir();
      const imageAbsolutePath = await join(appLocalDataPath, imageRelativePath);
      const imageUrl = resolveChatBackgroundAssetUrl(imageAbsolutePath);

      setPendingCustomBackgrounds((prev) => [{ url: imageAbsolutePath }, ...prev]);
      trackSettingsInteraction("appearance", "custom_chat_background_added");
      setChatBackground((prev) => {
        const currentUrls = prev.customUrls ?? [];
        const customUrls = currentUrls.includes(imageAbsolutePath)
          ? currentUrls
          : [imageAbsolutePath, ...currentUrls];

        return {
          ...DEFAULT_SETTINGS.CHAT_BACKGROUND,
          ...prev,
          customUrl: imageAbsolutePath,
          customUrls,
          customThumbnails: {
            ...prev.customThumbnails,
          },
          preset: "custom",
        };
      });

      try {
        await createThumbnailFile(imageUrl, thumbnailRelativePath);
        setChatBackground((prev) => ({
          ...DEFAULT_SETTINGS.CHAT_BACKGROUND,
          ...prev,
          customThumbnails: {
            ...prev.customThumbnails,
          },
        }));
      } catch {
        setChatBackground((prev) => ({
          ...DEFAULT_SETTINGS.CHAT_BACKGROUND,
          ...prev,
          customThumbnails: {
            ...prev.customThumbnails,
            [imageAbsolutePath]: imageAbsolutePath,
          },
        }));
      } finally {
        setPendingCustomBackgrounds((prev) =>
          prev.filter((background) => background.url !== imageAbsolutePath),
        );
      }
    } finally {
      addingCustomBackgroundRef.current = false;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("appearance.generalLook")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-theme">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.theme")}</Label>
              </div>
              <ThemeToggle className="md:justify-end" />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-language">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("settings.language")}</Label>
              </div>
              <LanguagePicker className="w-full md:w-fit md:max-w-96" />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-primary-color">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.primaryColor")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.primaryColorDescription")}
                </p>
              </div>
              <ColorPicker
                label={t("appearance.primaryColorLabel")}
                value={colorTheme}
                onValueChange={(value) => {
                  trackSettingsInteraction("appearance", "primary_color_changed", {
                    value,
                  });
                  setColorTheme(value as typeof colorTheme);
                }}
                options={colorThemeOptions.map((option) => ({
                  ...option,
                  label: t(`appearance.colors.${option.value}`),
                }))}
              />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-tint">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.tint")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.tintDescription")}
                </p>
              </div>
              <ColorPicker
                label={t("appearance.tint")}
                value={uiTint}
                onValueChange={(value) => {
                  trackSettingsInteraction("appearance", "tint_changed", { value });
                  setUiTint(value as typeof uiTint);
                }}
                options={colorThemeOptions.map((option) => ({
                  ...option,
                  label: t(`appearance.colors.${option.value}`),
                }))}
              />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-tint-strength">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-col items-start">
                  <Label className="text-sm font-medium tabular-nums">
                    {t("appearance.tintStrength", { value: uiTintStrength })}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("appearance.tintStrengthDescription")}
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
                  aria-label={t("appearance.resetTintStrength")}
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
                aria-label={t("appearance.tintStrengthAria")}
                disabled={uiTint === "default"}
              />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-font">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.font")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.fontDescription")}
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
                aria-label={t("appearance.selectFont")}
                className="w-full min-w-64 md:w-fit"
              >
                {fontOptions.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    aria-label={t(`appearance.fonts.${option.value}`)}
                    className={option.className}
                  >
                    {t(`appearance.fonts.${option.value}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-roundness">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.roundness")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.roundnessDescription")}
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
                aria-label={t("appearance.selectRoundness")}
                className="w-full md:w-fit"
                size="lg"
              >
                {roundnessOptions.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    aria-label={t(`appearance.roundnessOptions.${option.value}`)}
                    title={t(`appearance.roundnessOptions.${option.value}`)}
                    size="lg"
                    className="size-16"
                  >
                    <div className={cn("bg-primary size-10", option.radius)} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-text-scale">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.textScale")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.textScaleDescription")}
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
                    aria-label={t("appearance.selectTextScale")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {textScaleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`appearance.textScaleOptions.${option.value}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance.chatBackground")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-chat-background">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col items-start">
                  <Label className="text-sm font-medium">{t("appearance.backgroundImage")}</Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("appearance.backgroundImageDescription")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("appearance", "reset_chat_background");
                    setChatBackground((prev) => ({
                      ...prev,
                      tint: chatBackgroundDefaults.tint,
                      blur: chatBackgroundDefaults.blur,
                      dim: chatBackgroundDefaults.dim,
                      x: chatBackgroundDefaults.x,
                      y: chatBackgroundDefaults.y,
                      zoom: chatBackgroundDefaults.zoom,
                      backgroundShade: chatBackgroundDefaults.backgroundShade,
                    }));
                  }}
                  disabled={isChatBackgroundDefault}
                  aria-label={t("appearance.resetChatBackground")}
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex aspect-video h-auto flex-col gap-1"
                  onClick={() => void handleAddCustomBackground()}
                >
                  <IconPhotoPlus data-icon="inline-start" />
                  {t("appearance.addCustom")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="relative flex aspect-video h-auto flex-col gap-1 overflow-hidden"
                  onClick={() => updateChatBackground({ preset: "none" })}
                >
                  <IconPhotoOff data-icon="inline-start" />
                  {t("common.none")}
                  {chatBackground.preset === "none" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                      <IconCheck className="size-8" data-icon="inline-start" />
                    </span>
                  )}
                </Button>

                {(chatBackground.customUrls ?? []).map((url) => (
                  <Button
                    key={url}
                    type="button"
                    variant="outline"
                    className="relative aspect-video h-auto overflow-hidden bg-cover bg-center p-0"
                    style={{
                      backgroundImage: cssImageUrl(
                        resolveChatBackgroundAssetUrl(
                          chatBackground.customThumbnails?.[url] ?? url,
                        ),
                      ),
                    }}
                    onClick={() => updateChatBackground({ preset: "custom", customUrl: url })}
                    title={t("appearance.customBackground")}
                  >
                    <Popover
                      open={removingCustomUrl === url}
                      onOpenChange={(open) => setRemovingCustomUrl(open ? url : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="bg-background/80 hover:bg-background absolute top-1 right-1"
                          aria-label={t("appearance.removeCustomBackground")}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <IconX data-icon="inline-start" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end">
                        <PopoverHeader>
                          <PopoverTitle>{t("appearance.deleteBackgroundTitle")}</PopoverTitle>
                          <PopoverDescription>
                            {t("appearance.deleteBackgroundDescription")}
                          </PopoverDescription>
                        </PopoverHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRemovingCustomUrl(null);
                            }}
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeCustomBackground(url);
                              setRemovingCustomUrl(null);
                            }}
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {pendingCustomBackgrounds.some((background) => background.url === url) ? (
                      <span className="absolute inset-0">
                        <Skeleton className="h-full w-full rounded-[inherit]" />
                      </span>
                    ) : null}
                    {chatBackground.preset === "custom" && chatBackground.customUrl === url && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                        <IconCheck className="size-8" data-icon="inline-start" />
                      </span>
                    )}
                    <span className="absolute right-2 bottom-2 text-xs font-medium text-white drop-shadow">
                      {t("appearance.custom")}
                    </span>
                  </Button>
                ))}

                {Object.entries(chatBackgroundPresets).map(([value, preset]) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    className="relative aspect-video h-auto overflow-hidden bg-cover bg-center p-0"
                    style={{ backgroundImage: cssImageUrl(preset.thumbnailUrl) }}
                    onClick={() =>
                      updateChatBackground({ preset: value as ChatBackgroundPresetOption })
                    }
                    title={t(`appearance.backgroundPresets.${value}`, {
                      defaultValue: preset.label,
                    })}
                  >
                    {chatBackground.preset === value && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                        <IconCheck className="size-8" data-icon="inline-start" />
                      </span>
                    )}
                    <span className="absolute right-2 bottom-2 text-xs font-medium text-white drop-shadow">
                      {t(`appearance.backgroundPresets.${value}`, { defaultValue: preset.label })}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-chat-background-effects">
            <div className="grid gap-4 md:grid-cols-3">
              <ChatBackgroundSlider
                label={t("appearance.opacity")}
                value={chatBackground.tint}
                defaultValue={chatBackgroundDefaults.tint}
                suffix="%"
                onCommit={(value) => updateChatBackground({ tint: value })}
                min={0}
                max={70}
                step={5}
                aria-label={t("appearance.tintAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
              <ChatBackgroundSlider
                label={t("appearance.blur")}
                value={chatBackground.blur}
                defaultValue={chatBackgroundDefaults.blur}
                suffix="px"
                onCommit={(value) => updateChatBackground({ blur: value })}
                min={0}
                max={20}
                step={1}
                aria-label={t("appearance.blurAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
              <ChatBackgroundSlider
                label={t("appearance.dim")}
                value={chatBackground.dim}
                defaultValue={chatBackgroundDefaults.dim}
                suffix="%"
                onCommit={(value) => updateChatBackground({ dim: value })}
                min={0}
                max={70}
                step={5}
                aria-label={t("appearance.dimAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
              <ChatBackgroundSlider
                label={t("appearance.positionX")}
                value={chatBackground.x}
                defaultValue={chatBackgroundDefaults.x}
                suffix="%"
                onCommit={(value) => updateChatBackground({ x: value })}
                min={0}
                max={100}
                step={1}
                aria-label={t("appearance.xAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
              <ChatBackgroundSlider
                label={t("appearance.positionY")}
                value={chatBackground.y}
                defaultValue={chatBackgroundDefaults.y}
                suffix="%"
                onCommit={(value) => updateChatBackground({ y: value })}
                min={0}
                max={100}
                step={1}
                aria-label={t("appearance.yAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
              <ChatBackgroundSlider
                label={t("appearance.zoom")}
                value={chatBackground.zoom}
                defaultValue={chatBackgroundDefaults.zoom}
                suffix="%"
                onCommit={(value) => updateChatBackground({ zoom: value })}
                min={100}
                max={200}
                step={5}
                aria-label={t("appearance.zoomAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
            </div>
          </SettingsTarget>

          <Separator orientation="horizontal" />

          <SettingsTarget id="setting-chat-background-overlay">
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-1 flex-col items-start">
                  <Label className="text-sm font-medium">{t("appearance.backgroundShade")}</Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {t("appearance.backgroundShadeDescription")}
                  </p>
                </div>
              </div>
              <ChatBackgroundSlider
                label={t("appearance.shadeOpacity")}
                value={chatBackground.backgroundShade}
                defaultValue={chatBackgroundDefaults.backgroundShade}
                suffix="%"
                onCommit={(value) => updateChatBackground({ backgroundShade: value })}
                min={0}
                max={100}
                step={5}
                aria-label={t("appearance.shadeOpacityAria")}
                disabled={chatBackground.preset === "none"}
                orientation="horizontal"
              />
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance.chatAppearance")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-markdown-highlighting">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">
                  {t("appearance.markdownHighlighting")}
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.markdownHighlightingDescription")}
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
                  aria-label={t("appearance.toggleMarkdownHighlighting")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetMarkdownHighlighting}
                  disabled={isMarkdownHighlightingDefault}
                  aria-label={t("common.resetToDefault")}
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-input-style">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">{t("appearance.inputStyle")}</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.inputStyleDescription")}
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
                    aria-label={t("appearance.selectInputStyle")}
                  >
                    <SelectValue placeholder={t("appearance.selectStyle")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="docked">{t("appearance.docked")}</SelectItem>
                      <SelectItem value="floating">{t("appearance.floating")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetInputStyle}
                  disabled={isInputStyleDefault}
                  aria-label={t("common.resetToDefault")}
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-collapsed-sidebar-layout">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">
                  {t("appearance.collapsedSidebarLayout")}
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("appearance.collapsedSidebarLayoutDescription")}
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
                    aria-label={t("appearance.selectCollapsedSidebarLayout")}
                  >
                    <SelectValue placeholder={t("appearance.selectLayout")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="row">{t("appearance.row")}</SelectItem>
                      <SelectItem value="column">{t("appearance.column")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetCollapsedSidebarLayout}
                  disabled={isCollapsedSidebarLayoutDefault}
                  aria-label={t("common.resetToDefault")}
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>
    </div>
  );
}
