"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ThemeSelectProps {
  className?: string;
}

const ThemeSelect = ({ className }: ThemeSelectProps) => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleThemeChange = (theme: string) => {
    setTheme(theme);
  };

  return (
    <Select onValueChange={handleThemeChange} defaultValue={theme || "system"}>
      <SelectTrigger
        className={cn("w-full", className)}
        aria-label={`Theme: ${theme || "System"}`}
      >
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ThemeSelect;
