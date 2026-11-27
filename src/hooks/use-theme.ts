import { useAtom } from "jotai";

import { useMediaQuery } from "@/hooks/use-media-query";
import { getResolvedTheme, SYSTEM_DARK_QUERY } from "@/lib/get-resolved-theme";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import type { SettingValue } from "@/lib/settings/definitions";

export function useTheme() {
  const [theme, setTheme] = useAtom(settingAtoms.THEME);
  const systemDark = useMediaQuery(SYSTEM_DARK_QUERY);
  const resolvedTheme = getResolvedTheme(theme, systemDark);

  return {
    theme,
    resolvedTheme,
    setTheme: (value: string) => setTheme(value as SettingValue<"THEME">),
  };
}
