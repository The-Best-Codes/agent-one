import { useAtom } from "jotai";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import { themeAtom } from "@/lib/jotai/settings-atoms";
import type { ThemeOption } from "@/lib/settings/types";

export function useTheme() {
  const [theme, setTheme] = useAtom(themeAtom);
  const resolvedTheme = getResolvedTheme(theme);

  return {
    theme,
    resolvedTheme,
    setTheme: (value: string) => setTheme(value as ThemeOption),
  };
}
