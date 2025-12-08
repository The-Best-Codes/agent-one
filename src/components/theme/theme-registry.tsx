import { useAtom } from "jotai";
import { useEffect } from "react";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import {
  colorThemeAtom,
  fontAtom,
  roundnessAtom,
  themeAtom,
} from "@/lib/jotai/settings-atoms";
import { jsonParseCatch } from "@/lib/json-parse-catch";

export function ThemeRegistry() {
  const [rawTheme] = useAtom(themeAtom);
  const [rawColorTheme] = useAtom(colorThemeAtom);
  const [rawRoundness] = useAtom(roundnessAtom);
  const [rawFont] = useAtom(fontAtom);

  const theme = jsonParseCatch(rawTheme);
  const colorTheme = jsonParseCatch(rawColorTheme);
  const roundness = jsonParseCatch(rawRoundness);
  const font = jsonParseCatch(rawFont);

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
    root.classList.remove("font-space-grotesk", "font-sans", "font-mono");
    if (font === "default") {
      root.classList.add("font-space-grotesk");
    } else if (font === "system") {
      root.classList.add("font-sans");
    } else if (font === "mono") {
      root.classList.add("font-mono");
    }
    root.setAttribute("data-font", font || "default");
  }, [theme, colorTheme, roundness, font]);

  return null;
}
