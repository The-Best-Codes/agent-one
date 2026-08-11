// TODO: Support EVERY theme from https://ui.shadcn.com/create, update src/index.css, find the themes in shadcn/ui GitHub repo.
import { useAtom } from "jotai";
import { useEffect } from "react";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import {
  colorThemeAtom,
  fontAtom,
  roundnessAtom,
  textScaleAtom,
  themeAtom,
  uiTintAtom,
  uiTintStrengthAtom,
} from "@/lib/jotai/settings-atoms";
import { jsonParseCatch } from "@/lib/json-parse-catch";

const UI_TINT_STRENGTHS: Record<number, string> = {
  1: "2%",
  2: "4%",
  3: "6%",
  4: "8%",
  5: "10%",
  6: "12%",
  7: "14%",
  8: "16%",
  9: "18%",
  10: "20%",
};

export function ThemeRegistry() {
  const [rawTheme] = useAtom(themeAtom);
  const [rawColorTheme] = useAtom(colorThemeAtom);
  const [rawUiTint] = useAtom(uiTintAtom);
  const [rawUiTintStrength] = useAtom(uiTintStrengthAtom);
  const [rawRoundness] = useAtom(roundnessAtom);
  const [rawFont] = useAtom(fontAtom);
  const [rawTextScale] = useAtom(textScaleAtom);

  const theme = jsonParseCatch(rawTheme);
  const colorTheme = jsonParseCatch(rawColorTheme);
  const uiTint = jsonParseCatch(rawUiTint);
  const uiTintStrength = rawUiTintStrength;
  const roundness = jsonParseCatch(rawRoundness);
  const font = jsonParseCatch(rawFont);
  const textScale = jsonParseCatch(rawTextScale);

  useEffect(() => {
    // Handle theme
    const root = document.documentElement;
    const resolvedTheme = getResolvedTheme(theme);

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);

    // Handle color theme
    root.classList.remove("red", "blue", "yellow", "green", "orange", "rose", "violet");
    if (colorTheme && colorTheme !== "default") {
      root.classList.add(colorTheme);
    }
    root.setAttribute("data-color-theme", colorTheme || "default");

    root.classList.remove(
      "ui-tint-red",
      "ui-tint-blue",
      "ui-tint-yellow",
      "ui-tint-green",
      "ui-tint-orange",
      "ui-tint-rose",
      "ui-tint-violet",
    );
    if (uiTint && uiTint !== "default") {
      root.classList.add(`ui-tint-${uiTint}`);
    }
    root.setAttribute("data-ui-tint", uiTint || "default");

    const resolvedUiTintStrength =
      typeof uiTintStrength === "number" && uiTintStrength in UI_TINT_STRENGTHS
        ? UI_TINT_STRENGTHS[uiTintStrength]
        : UI_TINT_STRENGTHS[3];
    root.style.setProperty(
      "--ui-tint-strength",
      uiTint && uiTint !== "default" ? resolvedUiTintStrength : "0%",
    );
    root.setAttribute("data-ui-tint-strength", String(uiTintStrength || 3));

    // Handle roundness
    root.classList.remove(
      "theme-radius-none",
      "theme-radius-sm",
      "theme-radius-md",
      "theme-radius-lg",
    );
    root.classList.add(`theme-radius-${roundness || "md"}`);
    root.setAttribute("data-roundness", roundness || "md");

    // Handle font
    root.classList.remove("font-space-grotesk", "font-sans", "font-mono", "font-roboto");
    if (font === "default") {
      root.classList.add("font-space-grotesk");
    } else if (font === "system") {
      root.classList.add("font-sans");
    } else if (font === "mono") {
      root.classList.add("font-mono");
    } else if (font === "roboto") {
      root.classList.add("font-roboto");
    }
    root.setAttribute("data-font", font || "default");

    // TODO: Consider using `zoom-*` from Tailwind for UI zoom rather than `text-*`?
    root.classList.remove("text-xs", "text-sm", "text-md", "text-lg", "text-xl", "text-2xl");
    root.classList.add(`text-${textScale || "md"}`);
    root.setAttribute("data-text-scale", textScale || "md");
  }, [theme, colorTheme, uiTint, uiTintStrength, roundness, font, textScale]);

  return null;
}
