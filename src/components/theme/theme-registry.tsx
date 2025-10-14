import { useAtom } from "jotai";
import { useEffect } from "react";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import { roundnessAtom, themeAtom } from "@/lib/jotai/settings-atoms";
import { jsonParseCatch } from "@/lib/json-parse-catch";

export function ThemeRegistry() {
  const [rawTheme] = useAtom(themeAtom);
  const [rawRoundness] = useAtom(roundnessAtom);

  const theme = jsonParseCatch(rawTheme);
  const roundness = jsonParseCatch(rawRoundness);

  useEffect(() => {
    // Handle theme
    const root = document.documentElement;
    const resolvedTheme = getResolvedTheme(theme);

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);

    // Handle roundness
    root.classList.remove(
      "theme-radius-none",
      "theme-radius-sm",
      "theme-radius-md",
      "theme-radius-lg",
    );
    root.classList.add(`theme-radius-${roundness || "md"}`);
    root.setAttribute("data-roundness", roundness || "md");
  }, [theme, roundness]);

  return null;
}
