import { useAtom } from "jotai";
import { useEffect } from "react";

import { roundnessAtom, themeAtom } from "@/lib/jotai/settings-atoms";

export function ThemeRegistry() {
  const [theme] = useAtom(themeAtom);
  const [roundness] = useAtom(roundnessAtom);

  useEffect(() => {
    // Handle theme
    const root = document.documentElement;
    const resolvedTheme =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

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
    root.classList.add(`theme-radius-${roundness}`);
    root.setAttribute("data-roundness", roundness);
  }, [theme, roundness]);

  return null;
}
