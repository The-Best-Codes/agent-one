"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
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
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="system">System</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="dim">Dim</SelectItem>
        <SelectItem value="slate-light">Slate (Light)</SelectItem>
        <SelectItem value="slate-dark">Slate (Dark)</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ThemeToggle;
