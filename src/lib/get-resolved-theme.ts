import { jsonParseCatch } from "@/lib/json-parse-catch";

export const getResolvedTheme = (rawTheme: string): string => {
  let themeToResolve = jsonParseCatch(rawTheme);
  if (!rawTheme) {
    themeToResolve = "system";
  }

  if (themeToResolve !== "system") {
    return themeToResolve;
  }

  if (themeToResolve === "system") {
    if (typeof window !== "undefined") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      return systemTheme;
    }
    return "light";
  }

  return "light";
};
