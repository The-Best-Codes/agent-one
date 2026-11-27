import { jsonParseCatch } from "@/lib/json-parse-catch";

export const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const getSystemDark = () =>
  typeof window !== "undefined" ? window.matchMedia(SYSTEM_DARK_QUERY).matches : false;

export const getResolvedTheme = (rawTheme: string, systemDark = getSystemDark()): string => {
  const themeToResolve = rawTheme ? jsonParseCatch(rawTheme) : "system";

  if (themeToResolve !== "system") {
    return themeToResolve;
  }

  return systemDark ? "dark" : "light";
};
