import type { ChatBackgroundPresetOption, ChatBackgroundSettings } from "@/lib/settings/types";

export const chatBackgroundPresets: Record<
  Exclude<ChatBackgroundPresetOption, "none" | "custom">,
  { label: string; url: string; thumbnailUrl: string }
> = {
  aurora: {
    label: "Aurora",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=320&q=35",
  },
  mist: {
    label: "Morning Mist",
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=35",
  },
  forest: {
    label: "Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=320&q=35",
  },
  desert: {
    label: "Desert",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=320&q=35",
  },
  ocean: {
    label: "Ocean",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=35",
  },
  mountain: {
    label: "Mountain",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=320&q=35",
  },
  sunset: {
    label: "Sunset",
    url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=320&q=35",
  },
  night: {
    label: "Night Sky",
    url: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=2400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=320&q=35",
  },
};

export function cssImageUrl(url: string) {
  return `url("${url.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}")`;
}

export function getChatBackgroundUrl(settings: ChatBackgroundSettings) {
  if (settings.preset === "custom") {
    return settings.customUrl.trim();
  }

  if (settings.preset === "none") {
    return "";
  }

  return chatBackgroundPresets[settings.preset]?.url ?? "";
}
