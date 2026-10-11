import { useAtom } from "jotai";

import { getResolvedTheme } from "@/lib/get-resolved-theme";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import type { SettingValue } from "@/lib/settings/definitions";

export function useTheme() {
  const [theme, setTheme] = useAtom(settingAtoms.THEME);
  const resolvedTheme = getResolvedTheme(theme);

  return {
    theme,
    resolvedTheme,
    setTheme: (value: string) => setTheme(value as SettingValue<"THEME">),
  };
}
