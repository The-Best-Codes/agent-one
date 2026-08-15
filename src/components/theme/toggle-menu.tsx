"use client";

import { IconBrightness, IconMoon, IconSun } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/hooks/use-theme";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { t } = useTranslation();
  const { setTheme, theme, resolvedTheme } = useTheme();

  if (!resolvedTheme) {
    return null;
  }

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme ?? "system"}
      onValueChange={(value) => {
        if (value) {
          logger.verbose("Theme changed", {
            from: theme,
            to: value,
          });
          setTheme(value);
        }
      }}
      className={cn("w-full", className)}
      aria-label={t("appearance.selectTheme")}
    >
      <ToggleGroupItem value="system" aria-label={t("appearance.themeSystemAria")}>
        <span className="flex items-center gap-1 text-sm">
          <IconBrightness data-icon="inline-start" />
          {t("appearance.themeSystem")}
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label={t("appearance.themeLightAria")}>
        <span className="flex items-center gap-1 text-sm">
          <IconSun data-icon="inline-start" />
          {t("appearance.themeLight")}
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label={t("appearance.themeDarkAria")}>
        <span className="flex items-center gap-1 text-sm">
          <IconMoon data-icon="inline-start" />
          {t("appearance.themeDark")}
        </span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ThemeToggle;
