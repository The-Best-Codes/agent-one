import { useAtom } from "jotai";
import { useEffect } from "react";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { jsonParseCatch } from "@/lib/json-parse-catch";
import { SETTINGS } from "@/lib/settings/definitions";

const PRIMARY_COLOR_THEMES = Object.keys(SETTINGS.COLOR_THEME.options).filter(
  (option) => option !== "default",
);
const UI_TINTS = Object.keys(SETTINGS.UI_TINT.options).filter((option) => option !== "default");

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
  const [rawTheme] = useAtom(settingAtoms.THEME);
  const [rawColorTheme] = useAtom(settingAtoms.COLOR_THEME);
  const [rawUiTint] = useAtom(settingAtoms.UI_TINT);
  const [rawUiTintStrength] = useAtom(settingAtoms.UI_TINT_STRENGTH);
  const [rawRoundness] = useAtom(settingAtoms.ROUNDNESS);
  const [rawFont] = useAtom(settingAtoms.FONT);
  const [rawTextScale] = useAtom(settingAtoms.TEXT_SCALE);

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
    root.classList.remove(...PRIMARY_COLOR_THEMES);
    if (colorTheme && colorTheme !== "default") {
      root.classList.add(colorTheme);
    }
    root.setAttribute("data-color-theme", colorTheme || "default");

    root.classList.remove(...UI_TINTS.map((name) => `ui-tint-${name}`));
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

    root.classList.remove("text-xs", "text-sm", "text-md", "text-lg", "text-xl", "text-2xl");
    root.classList.add(`text-${textScale || "md"}`);
    root.setAttribute("data-text-scale", textScale || "md");
  }, [theme, colorTheme, uiTint, uiTintStrength, roundness, font, textScale]);

  return null;
}
