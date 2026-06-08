import { IconCheck, IconPhotoOff, IconPhotoPlus, IconRestore, IconX } from "@tabler/icons-react";
import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";

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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const CUSTOM_BACKGROUND_DIR = "chat-backgrounds";
const CUSTOM_BACKGROUND_IMAGE_DIR = `${CUSTOM_BACKGROUND_DIR}/images`;
const CUSTOM_BACKGROUND_THUMBNAIL_DIR = `${CUSTOM_BACKGROUND_DIR}/thumbnails`;

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

export default function AppearanceSection() {
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

  const activeColorRef = useCallback((node: HTMLButtonElement | null) => {
    if (node) {
      node.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, []);

  const isMarkdownHighlightingDefault =
    markdownHighlighting === DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING;
  const isUiTintStrengthDefault = uiTintStrength === DEFAULT_SETTINGS.UI_TINT_STRENGTH;
  const isChatBackgroundDefault =
    JSON.stringify(chatBackground) === JSON.stringify(DEFAULT_SETTINGS.CHAT_BACKGROUND);
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
      const customThumbnails = { ...(prev.customThumbnails ?? {}) };
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
      const thumbnailAbsolutePath = await join(appLocalDataPath, thumbnailRelativePath);
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
            ...(prev.customThumbnails ?? {}),
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
            ...(prev.customThumbnails ?? {}),
            [imageAbsolutePath]: thumbnailAbsolutePath,
          },
        }));
      } catch {
        setChatBackground((prev) => ({
          ...DEFAULT_SETTINGS.CHAT_BACKGROUND,
          ...prev,
          customThumbnails: {
            ...(prev.customThumbnails ?? {}),
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
          <CardTitle>General Look and Feel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-theme">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium">Theme</Label>
              </div>
              <ThemeToggle className="md:max-w-64" />
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-primary-color">
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
          </SettingsTarget>

          <SettingsTarget id="setting-tint">
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
          </SettingsTarget>

          <SettingsTarget id="setting-tint-strength">
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
          </SettingsTarget>

          <SettingsTarget id="setting-font">
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
          </SettingsTarget>

          <SettingsTarget id="setting-roundness">
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
          </SettingsTarget>

          <SettingsTarget id="setting-text-scale">
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
          </SettingsTarget>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Background</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-chat-background">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col items-start">
                  <Label className="text-sm font-medium">Background Image</Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Pick a preset or add your own image behind the main chat area.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("appearance", "reset_chat_background");
                    resetSetting("CHAT_BACKGROUND");
                  }}
                  disabled={isChatBackgroundDefault}
                  aria-label="Reset chat background"
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
                        resolveChatBackgroundAssetUrl(
                          chatBackground.customThumbnails?.[url] ?? url,
                        ),
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
                        <span
                          role="button"
                          tabIndex={0}
                          className="bg-background/80 hover:bg-background absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-md"
                          aria-label="Remove custom background"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <IconX data-icon="inline-start" />
                        </span>
                      </PopoverTrigger>
                      <PopoverContent align="end">
                        <PopoverHeader>
                          <PopoverTitle>Delete this background?</PopoverTitle>
                          <PopoverDescription>
                            This removes it from your custom list.
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
                    onClick={() =>
                      updateChatBackground({ preset: value as ChatBackgroundPresetOption })
                    }
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
          </SettingsTarget>

          <SettingsTarget id="setting-chat-background-effects">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label className="text-sm tabular-nums">Tint: {chatBackground.tint ?? 0}%</Label>
                <Slider
                  value={[chatBackground.tint ?? DEFAULT_SETTINGS.CHAT_BACKGROUND.tint]}
                  onValueChange={(value) => updateChatBackground({ tint: value[0] })}
                  min={0}
                  max={70}
                  step={5}
                  aria-label="Chat background tint"
                  disabled={chatBackground.preset === "none"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm tabular-nums">Blur: {chatBackground.blur ?? 0}px</Label>
                <Slider
                  value={[chatBackground.blur ?? DEFAULT_SETTINGS.CHAT_BACKGROUND.blur]}
                  onValueChange={(value) => updateChatBackground({ blur: value[0] })}
                  min={0}
                  max={20}
                  step={1}
                  aria-label="Chat background blur"
                  disabled={chatBackground.preset === "none"}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm tabular-nums">Dim: {chatBackground.dim ?? 0}%</Label>
                <Slider
                  value={[chatBackground.dim ?? DEFAULT_SETTINGS.CHAT_BACKGROUND.dim]}
                  onValueChange={(value) => updateChatBackground({ dim: value[0] })}
                  min={0}
                  max={70}
                  step={5}
                  aria-label="Chat background dim"
                  disabled={chatBackground.preset === "none"}
                />
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-markdown-highlighting">
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
          </SettingsTarget>

          <SettingsTarget id="setting-input-style">
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
          </SettingsTarget>

          <SettingsTarget id="setting-collapsed-sidebar-layout">
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
          </SettingsTarget>
        </CardContent>
      </Card>
    </div>
  );
}
