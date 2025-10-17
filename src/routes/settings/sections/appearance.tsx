import { useAtom } from "jotai";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { roundnessAtom, themeAtom } from "@/lib/jotai/settings-atoms";

const roundnessOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

export default function AppearanceSection() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [roundness, setRoundness] = useAtom(roundnessAtom);

  const getRoundnessIndex = (value: string) => {
    const index = roundnessOptions.findIndex(
      (option) => option.value === value,
    );
    return index >= 0
      ? index
      : roundnessOptions.findIndex((option) => option.value === "md");
  };

  const roundnessIndex = getRoundnessIndex(roundness);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <Label className="text-sm font-medium">Theme</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose your preferred theme for the application.
            </p>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(value) => {
              if (value) setTheme(value as "light" | "dark" | "system");
            }}
            className="w-full md:max-w-64"
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
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <Label className="text-sm font-medium">Roundness</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Adjust the corner radius of UI elements.
            </p>
          </div>
          <div className="flex w-full items-center gap-4 md:max-w-64">
            <Slider
              value={[roundnessIndex]}
              onValueChange={(value) => {
                setRoundness(
                  roundnessOptions[value[0]].value as
                    | "none"
                    | "sm"
                    | "md"
                    | "lg",
                );
              }}
              max={3}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-muted-foreground min-w-[3rem] text-sm">
              {roundnessOptions[roundnessIndex].label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
