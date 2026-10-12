import { basename } from "@tauri-apps/api/path";
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
const baseDir = BaseDirectory.AppLocalData;

export const FONT_CLASSES: Record<SettingValue<"FONT">, string> = {
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

export const activeCustomFontAtom = atom((get) => {
  const fonts = get(customFontsAtom);
  const activeId = get(activeCustomFontIdAtom);
  return (Array.isArray(fonts) && fonts.find((font) => font?.id === activeId)) || null;
});

export function resolveFontSetting(font: unknown): SettingValue<"FONT"> {
  return typeof font === "string" && Object.hasOwn(FONT_CLASSES, font)
    ? (font as SettingValue<"FONT">)
    : "default";
}

export async function loadCustomFontFace(font: CustomFont) {
  const bytes = await readFile(`${CUSTOM_FONT_DIR}/${font.fileName}`, { baseDir });
  return await new FontFace(CUSTOM_FONT_FAMILY, bytes).load();
}

export async function importCustomFonts() {
  const paths = await open({
    multiple: true,
    filters: [{ name: "Font", extensions: ["ttf", "otf", "woff", "woff2"] }],
  });
  const fonts: CustomFont[] = [];
  const failed: string[] = [];

  for (const path of paths ?? []) {
    let fileName = path;
    try {
      fileName = await basename(path);
      const bytes = await readFile(path);
      await new FontFace(`${CUSTOM_FONT_FAMILY} Validation`, bytes).load();
      const id = crypto.randomUUID();
      const storedName = `${id}.${fileName.split(".").pop()?.toLowerCase()}`;
      await mkdir(CUSTOM_FONT_DIR, { baseDir, recursive: true });
      await writeFile(`${CUSTOM_FONT_DIR}/${storedName}`, bytes, { baseDir });
      fonts.push({ id, name: fileName.replace(/\.[^.]+$/, ""), fileName: storedName });
    } catch {
      failed.push(fileName);
    }
  }

  return { fonts, failed };
}

export async function deleteCustomFontFile(font: CustomFont) {
  await remove(`${CUSTOM_FONT_DIR}/${font.fileName}`, { baseDir }).catch(() => undefined);
}
