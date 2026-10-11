import { IconCheck, IconPhotoOff, IconPhotoPlus, IconRestore, IconX } from "@tabler/icons-react";
import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { useAtom } from "jotai";
import { type ComponentProps, useRef, useState } from "react";

import { ColorPicker } from "@/components/a1/color-picker";
import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  chatBackgroundPresets,
  cssImageUrl,
  resolveChatBackgroundAssetUrl,
} from "@/lib/chat-backgrounds";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { DEFAULT_SETTINGS, SETTINGS, type SettingValue } from "@/lib/settings/definitions";
import type { ChatBackgroundPresetOption, ChatBackgroundSettings } from "@/lib/settings/types";
import { cn } from "@/lib/utils";

import { SettingsRow } from "../settings-sections";

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

const CUSTOM_BACKGROUND_DIR = "chat-backgrounds";
const CUSTOM_BACKGROUND_IMAGE_DIR = `${CUSTOM_BACKGROUND_DIR}/images`;
const CUSTOM_BACKGROUND_THUMBNAIL_DIR = `${CUSTOM_BACKGROUND_DIR}/thumbnails`;
const chatBackgroundDefaults = DEFAULT_SETTINGS.CHAT_BACKGROUND;
const EFFECT_KEYS = ["tint", "blur", "dim", "x", "y", "zoom", "backgroundShade"] as const;

type PendingCustomBackground = {
  url: string;
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

function useChatBackground() {
  const [chatBackground, setChatBackground] = useAtom(settingAtoms.CHAT_BACKGROUND);

  const updateChatBackground = (updates: Partial<ChatBackgroundSettings>) => {
    setChatBackground((prev) => ({ ...chatBackgroundDefaults, ...prev, ...updates }));
  };

  return { chatBackground, setChatBackground, updateChatBackground };
}

export function ChatBackgroundPicker() {
  const { chatBackground, setChatBackground, updateChatBackground } = useChatBackground();
  const [pendingCustomBackgrounds, setPendingCustomBackgrounds] = useState<
    PendingCustomBackground[]
  >([]);
  const [removingCustomUrl, setRemovingCustomUrl] = useState<string | null>(null);
  const addingCustomBackgroundRef = useRef(false);

  const isEffectsDefault = EFFECT_KEYS.every(
    (key) => (chatBackground[key] ?? chatBackgroundDefaults[key]) === chatBackgroundDefaults[key],
  );

  const removeManagedBackgroundFile = async (url: string) => {
    const thumbnailUrl = chatBackground.customThumbnails?.[url];

    await Promise.all([
      remove(url).catch(() => undefined),
      thumbnailUrl ? remove(thumbnailUrl).catch(() => undefined) : Promise.resolve(undefined),
    ]);
  };

  const removeCustomBackground = (url: string) => {
    void removeManagedBackgroundFile(url);
    setChatBackground((prev) => {
      const customUrls = (prev.customUrls ?? []).filter((customUrl) => customUrl !== url);
      const customThumbnails = { ...prev.customThumbnails };
      delete customThumbnails[url];
      const isRemovingActive = prev.preset === "custom" && prev.customUrl === url;

      return {
        ...chatBackgroundDefaults,
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
            name: "Image",
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

      setChatBackground((prev) => {
        const currentUrls = prev.customUrls ?? [];
        const customUrls = currentUrls.includes(imageAbsolutePath)
          ? currentUrls
          : [imageAbsolutePath, ...currentUrls];

        return {
          ...chatBackgroundDefaults,
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
      } catch {
        setChatBackground((prev) => ({
          ...chatBackgroundDefaults,
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
    <div className="flex flex-col gap-4">
      <SettingsRow
        label="Background Image"
        description="Pick a preset or add your own image behind the main chat area."
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              updateChatBackground(
                Object.fromEntries(EFFECT_KEYS.map((key) => [key, chatBackgroundDefaults[key]])),
              );
            }}
            disabled={isEffectsDefault}
            aria-label="Reset chat background"
          >
            <IconRestore />
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Button
          type="button"
          variant="outline"
          className="flex aspect-video h-auto flex-col gap-1"
          onClick={() => void handleAddCustomBackground()}
        >
          <IconPhotoPlus data-icon="inline-start" />
          Add Custom
        </Button>

        <Button
          type="button"
          variant="outline"
          className="relative flex aspect-video h-auto flex-col gap-1 overflow-hidden"
          onClick={() => updateChatBackground({ preset: "none" })}
        >
          <IconPhotoOff data-icon="inline-start" />
          None
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
                resolveChatBackgroundAssetUrl(chatBackground.customThumbnails?.[url] ?? url),
              ),
            }}
            onClick={() => updateChatBackground({ preset: "custom", customUrl: url })}
            title="Custom background"
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
                  aria-label="Remove custom background"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconX data-icon="inline-start" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <PopoverHeader>
                  <PopoverTitle>Delete this background?</PopoverTitle>
                  <PopoverDescription>This removes it from your custom list.</PopoverDescription>
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
                    Cancel
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
                    Delete
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
              Custom
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
            onClick={() => updateChatBackground({ preset: value as ChatBackgroundPresetOption })}
            title={preset.label}
          >
            {chatBackground.preset === value && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                <IconCheck className="size-8" data-icon="inline-start" />
              </span>
            )}
            <span className="absolute right-2 bottom-2 text-xs font-medium text-white drop-shadow">
              {preset.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

const ChatBackgroundSlider = ({
  label,
  field,
  suffix,
  ...props
}: {
  label: string;
  field: (typeof EFFECT_KEYS)[number];
  suffix: string;
} & Omit<
  ComponentProps<typeof Slider>,
  "defaultValue" | "value" | "onValueChange" | "onValueCommit"
>) => {
  const { chatBackground, updateChatBackground } = useChatBackground();
  const [draggingValue, setDraggingValue] = useState<number | null>(null);
  const displayValue = [draggingValue ?? chatBackground[field] ?? chatBackgroundDefaults[field]];

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
          updateChatBackground({ [field]: nextValue[0] });
        }}
        aria-label={`Chat background ${label.toLowerCase()}`}
        disabled={chatBackground.preset === "none"}
        {...props}
      />
    </div>
  );
};

export function ChatBackgroundEffects() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ChatBackgroundSlider label="Opacity" field="tint" suffix="%" min={0} max={70} step={5} />
        <ChatBackgroundSlider label="Blur" field="blur" suffix="px" min={0} max={20} step={1} />
        <ChatBackgroundSlider label="Dim" field="dim" suffix="%" min={0} max={70} step={5} />
        <ChatBackgroundSlider label="X" field="x" suffix="%" min={0} max={100} step={1} />
        <ChatBackgroundSlider label="Y" field="y" suffix="%" min={0} max={100} step={1} />
        <ChatBackgroundSlider label="Zoom" field="zoom" suffix="%" min={100} max={200} step={5} />
      </div>
      <Separator orientation="horizontal" />
    </div>
  );
}

export function ChatBackgroundShade() {
  return (
    <ChatBackgroundSlider
      label="Shade Opacity"
      field="backgroundShade"
      suffix="%"
      min={0}
      max={100}
      step={5}
    />
  );
}
