import { useAtom } from "jotai";
import { Check } from "lucide-react";

import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { colorThemeAtom, roundnessAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

const roundnessOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

const colorThemeOptions = [
  {
    value: "default",
    label: "Default",
    className:
      "bg-[oklch(0.205_0_0)] dark:bg-[oklch(0.922_0_0)] hover:bg-[oklch(0.205_0_0)] dark:hover:bg-[oklch(0.922_0_0)] text-white dark:text-black",
  },
  {
    value: "red",
    label: "Red",
    className:
      "bg-[oklch(0.577_0.245_27.325)] dark:bg-[oklch(0.637_0.237_25.331)] hover:bg-[oklch(0.577_0.245_27.325)] dark:hover:bg-[oklch(0.637_0.237_25.331)] text-white",
  },
  {
    value: "blue",
    label: "Blue",
    className:
      "bg-[oklch(0.488_0.243_264.376)] dark:bg-[oklch(0.488_0.243_264.376)] hover:bg-[oklch(0.488_0.243_264.376)] dark:hover:bg-[oklch(0.488_0.243_264.376)] text-white",
  },
  {
    value: "yellow",
    label: "Yellow",
    className:
      "bg-[oklch(0.852_0.199_91.936)] dark:bg-[oklch(0.795_0.184_86.047)] hover:bg-[oklch(0.852_0.199_91.936)] dark:hover:bg-[oklch(0.795_0.184_86.047)] text-black",
  },
] as const;

export default function AppearanceSection() {
  const [colorTheme, setColorTheme] = useAtom(colorThemeAtom);
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
          </div>
          <ThemeToggle className="md:max-w-64" />
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <Label className="text-sm font-medium">Color Theme</Label>
          </div>
          <div className="flex gap-3">
            {colorThemeOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => setColorTheme(option.value as typeof colorTheme)}
                size="icon"
                className={cn(
                  "border-foreground rounded-full border-2",
                  option.className,
                )}
                title={option.label}
              >
                {colorTheme === option.value && <Check className="size-5" />}
              </Button>
            ))}
          </div>
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
            <span className="text-muted-foreground min-w-12 text-sm">
              {roundnessOptions[roundnessIndex].label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
