import { useAtom } from "jotai";

import ThemeToggle from "@/components/theme/toggle-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { roundnessAtom } from "@/lib/jotai/settings-atoms";

const roundnessOptions = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
] as const;

export default function AppearanceSection() {
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
