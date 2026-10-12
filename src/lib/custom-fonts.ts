import { basename, extname } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, readFile, remove, writeFile } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { SettingValue } from "@/lib/settings/definitions";

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
}

const CUSTOM_FONT_FAMILY = "AgentOne Custom Font";
const CUSTOM_FONT_DIR = "custom-fonts";
const CUSTOM_FONT_EXTENSIONS = ["ttf", "otf", "woff", "woff2"];

export const BUILT_IN_FONT_CLASSES: Record<Exclude<SettingValue<"FONT">, "custom">, string> = {
  default: "font-space-grotesk",
  system: "font-sans",
  mono: "font-mono",
};

export const customFontsAtom = atomWithStorage<CustomFont[]>(
  "agent-one-custom-fonts",
  [],
  undefined,
  { getOnInit: true },
);

export const activeCustomFontIdAtom = atomWithStorage<string | null>(
  "agent-one-active-custom-font",
  null,
  undefined,
  { getOnInit: true },
);

function isCustomFont(value: unknown): value is CustomFont {
  if (!value || typeof value !== "object") return false;
  const font = value as Record<string, unknown>;
  return (
    typeof font.id === "string" &&
    typeof font.name === "string" &&
    typeof font.fileName === "string"
  );
}

export const validCustomFontsAtom = atom((get) => {
  const fonts = get(customFontsAtom);
  return Array.isArray(fonts) ? fonts.filter(isCustomFont) : [];
});

export const activeCustomFontAtom = atom((get) => {
  const activeId = get(activeCustomFontIdAtom);
  return get(validCustomFontsAtom).find((font) => font.id === activeId) ?? null;
});

export function resolveFontSetting(font: unknown, hasActiveCustomFont: boolean) {
  if (font === "custom") return hasActiveCustomFont ? "custom" : "default";
  return typeof font === "string" && Object.hasOwn(BUILT_IN_FONT_CLASSES, font)
    ? (font as keyof typeof BUILT_IN_FONT_CLASSES)
    : "default";
}

export async function loadCustomFontFace(font: CustomFont) {
  const bytes = await readFile(`${CUSTOM_FONT_DIR}/${font.fileName}`, {
    baseDir: BaseDirectory.AppLocalData,
  });
  return await new FontFace(CUSTOM_FONT_FAMILY, bytes).load();
}

export async function importCustomFont(): Promise<CustomFont | null> {
  const selectedPath = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Font", extensions: CUSTOM_FONT_EXTENSIONS }],
  });

  if (typeof selectedPath !== "string") return null;

  const extension = (await extname(selectedPath)).replace(/^\./, "").toLowerCase();
  if (!CUSTOM_FONT_EXTENSIONS.includes(extension)) {
    throw new Error("Choose a TTF, OTF, WOFF, or WOFF2 font file.");
  }

  const bytes = await readFile(selectedPath);
  try {
    await new FontFace(`${CUSTOM_FONT_FAMILY} Validation`, bytes).load();
  } catch {
    throw new Error("This file couldn't be read as a font.");
  }

  const id = `${Date.now()}-${crypto.randomUUID()}`;
  const fileName = `${id}.${extension}`;
  const name = (await basename(selectedPath)).replace(/\.[^.]+$/, "") || "Custom font";

  await mkdir(CUSTOM_FONT_DIR, { baseDir: BaseDirectory.AppLocalData, recursive: true });
  await writeFile(`${CUSTOM_FONT_DIR}/${fileName}`, bytes, {
    baseDir: BaseDirectory.AppLocalData,
  });

  return { id, name, fileName };
}

export async function deleteCustomFontFile(font: CustomFont) {
  await remove(`${CUSTOM_FONT_DIR}/${font.fileName}`, {
    baseDir: BaseDirectory.AppLocalData,
  }).catch(() => undefined);
}
