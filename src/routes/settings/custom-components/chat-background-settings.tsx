import { IconCheck, IconPhotoOff, IconPhotoPlus, IconRestore, IconX } from "@tabler/icons-react";
import { appLocalDataDir, extname, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { useAtom } from "jotai";
import { type ComponentProps, useRef, useState } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  chatBackgroundPresets,
  cssImageUrl,
  resolveChatBackgroundAssetUrl,
} from "@/lib/chat-backgrounds";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { chatBackgroundAtom } from "@/lib/jotai/settings-atoms";
import { type ChatBackgroundPresetOption, DEFAULT_SETTINGS } from "@/lib/settings/types";

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

export function ChatBackgroundPicker() {
  const [chatBackground, setChatBackground] = useAtom(chatBackgroundAtom);
  const [pendingCustomBackgrounds, setPendingCustomBackgrounds] = useState<
    PendingCustomBackground[]
  >([]);
  const [removingCustomUrl, setRemovingCustomUrl] = useState<string | null>(null);
  const addingCustomBackgroundRef = useRef(false);

  const isEffectsDefault =
    chatBackground.tint === chatBackgroundDefaults.tint &&
    chatBackground.blur === chatBackgroundDefaults.blur &&
    chatBackground.dim === chatBackgroundDefaults.dim &&
    (chatBackground.x ?? chatBackgroundDefaults.x) === chatBackgroundDefaults.x &&
    (chatBackground.y ?? chatBackgroundDefaults.y) === chatBackgroundDefaults.y &&
    (chatBackground.zoom ?? chatBackgroundDefaults.zoom) === chatBackgroundDefaults.zoom &&
    (chatBackground.backgroundShade ?? chatBackgroundDefaults.backgroundShade) ===
      chatBackgroundDefaults.backgroundShade;

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
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
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
          disabled={isEffectsDefault}
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
                resolveChatBackgroundAssetUrl(chatBackground.customThumbnails?.[url] ?? url),
              ),
            }}
            onClick={() => updateChatBackground({ preset: "custom", customUrl: url })}
            title="Custom background"
          >
            <Popover
              open={removingCustomUrl === url}
              onOpenChange={(openPopover) => setRemovingCustomUrl(openPopover ? url : null)}
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

export function ChatBackgroundEffects() {
  const [chatBackground, setChatBackground] = useAtom(chatBackgroundAtom);
  const updateChatBackground = (updates: Partial<typeof DEFAULT_SETTINGS.CHAT_BACKGROUND>) => {
    setChatBackground((prev) => ({ ...DEFAULT_SETTINGS.CHAT_BACKGROUND, ...prev, ...updates }));
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ChatBackgroundSlider
        label="Opacity"
        value={chatBackground.tint}
        defaultValue={chatBackgroundDefaults.tint}
        suffix="%"
        onCommit={(value) => updateChatBackground({ tint: value })}
        min={0}
        max={70}
        step={5}
        aria-label="Chat background tint"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />

      <ChatBackgroundSlider
        label="Blur"
        value={chatBackground.blur}
        defaultValue={chatBackgroundDefaults.blur}
        suffix="px"
        onCommit={(value) => updateChatBackground({ blur: value })}
        min={0}
        max={20}
        step={1}
        aria-label="Chat background blur"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />

      <ChatBackgroundSlider
        label="Dim"
        value={chatBackground.dim}
        defaultValue={chatBackgroundDefaults.dim}
        suffix="%"
        onCommit={(value) => updateChatBackground({ dim: value })}
        min={0}
        max={70}
        step={5}
        aria-label="Chat background dim"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />

      <ChatBackgroundSlider
        label="X"
        value={chatBackground.x}
        defaultValue={chatBackgroundDefaults.x}
        suffix="%"
        onCommit={(value) => updateChatBackground({ x: value })}
        min={0}
        max={100}
        step={1}
        aria-label="Chat background horizontal position"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />

      <ChatBackgroundSlider
        label="Y"
        value={chatBackground.y}
        defaultValue={chatBackgroundDefaults.y}
        suffix="%"
        onCommit={(value) => updateChatBackground({ y: value })}
        min={0}
        max={100}
        step={1}
        aria-label="Chat background vertical position"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />

      <ChatBackgroundSlider
        label="Zoom"
        value={chatBackground.zoom}
        defaultValue={chatBackgroundDefaults.zoom}
        suffix="%"
        onCommit={(value) => updateChatBackground({ zoom: value })}
        min={100}
        max={200}
        step={5}
        aria-label="Chat background zoom"
        disabled={chatBackground.preset === "none"}
        orientation="horizontal"
      />
    </div>
  );
}

export function ChatBackgroundOverlay() {
  const [chatBackground, setChatBackground] = useAtom(chatBackgroundAtom);
  const updateChatBackground = (updates: Partial<typeof DEFAULT_SETTINGS.CHAT_BACKGROUND>) => {
    setChatBackground((prev) => ({ ...DEFAULT_SETTINGS.CHAT_BACKGROUND, ...prev, ...updates }));
  };

  return (
    <ChatBackgroundSlider
      label="Shade Opacity"
      value={chatBackground.backgroundShade}
      defaultValue={chatBackgroundDefaults.backgroundShade}
      suffix="%"
      onCommit={(value) => updateChatBackground({ backgroundShade: value })}
      min={0}
      max={100}
      step={5}
      aria-label="Chat background shade opacity"
      disabled={chatBackground.preset === "none"}
      orientation="horizontal"
    />
  );
}
