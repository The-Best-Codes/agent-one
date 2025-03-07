"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { setTheme, resolvedTheme } = useTheme();
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
    <Select
      onValueChange={handleThemeChange}
      defaultValue={resolvedTheme || "system"}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="dim">Dim</SelectItem>
        <SelectItem value="retro-light">Retro (Light)</SelectItem>
        <SelectItem value="retro-dark">Retro (Dark)</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ThemeToggle;
