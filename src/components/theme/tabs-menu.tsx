"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeTabsProps {
  className?: string;
}

const ThemeTabs = ({ className }: ThemeTabsProps) => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Tabs
      defaultValue={theme || "system"}
      onValueChange={setTheme}
      className={cn("flex flex-col gap-2", className)}
    >
      <TabsList className="w-full" aria-label="Select a theme">
        <TabsTrigger value="system">
          <LaptopIcon /> System
        </TabsTrigger>
        <TabsTrigger value="light">
          <SunIcon /> Light
        </TabsTrigger>
        <TabsTrigger value="dark">
          <MoonIcon /> Dark
        </TabsTrigger>
      </TabsList>
      <TabsContent tabIndex={-1} value="system" className="sr-only" />
      <TabsContent tabIndex={-1} value="light" className="sr-only" />
      <TabsContent tabIndex={-1} value="dark" className="sr-only" />
    </Tabs>
  );
};

export default ThemeTabs;
