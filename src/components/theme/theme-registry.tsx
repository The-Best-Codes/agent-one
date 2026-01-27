import { useAtom } from "jotai";
import { useEffect } from "react";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import {
  colorThemeAtom,
  fontAtom,
  roundnessAtom,
  textScaleAtom,
  themeAtom,
} from "@/lib/jotai/settings-atoms";
import { jsonParseCatch } from "@/lib/json-parse-catch";

export function ThemeRegistry() {
  const [rawTheme] = useAtom(themeAtom);
  const [rawColorTheme] = useAtom(colorThemeAtom);
  const [rawRoundness] = useAtom(roundnessAtom);
  const [rawFont] = useAtom(fontAtom);
  const [rawTextScale] = useAtom(textScaleAtom);

  const theme = jsonParseCatch(rawTheme);
  const colorTheme = jsonParseCatch(rawColorTheme);
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
    root.classList.remove(
      "red",
      "blue",
      "yellow",
      "green",
      "orange",
      "rose",
      "violet",
    );
    if (colorTheme && colorTheme !== "default") {
      root.classList.add(colorTheme);
    }
    root.setAttribute("data-color-theme", colorTheme || "default");

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
    root.classList.remove(
      "font-space-grotesk",
      "font-sans",
      "font-mono",
      "font-roboto",
    );
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

    root.classList.remove(
      "text-xs",
      "text-sm",
      "text-md",
      "text-lg",
      "text-xl",
      "text-2xl",
    );
    root.classList.add(`text-${textScale || "md"}`);
    root.setAttribute("data-text-scale", textScale || "md");
  }, [theme, colorTheme, roundness, font, textScale]);

  return null;
}
