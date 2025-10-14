"use client";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/hooks/use-theme";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
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
      aria-label="Select a theme"
    >
      <ToggleGroupItem value="system" aria-label="System theme">
        <span className="flex items-center gap-1 text-sm">
          <LaptopIcon className="size-4" />
          System
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label="Light theme">
        <span className="flex items-center gap-1 text-sm">
          <SunIcon className="size-4" />
          Light
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme">
        <span className="flex items-center gap-1 text-sm">
          <MoonIcon className="size-4" />
          Dark
        </span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ThemeToggle;
