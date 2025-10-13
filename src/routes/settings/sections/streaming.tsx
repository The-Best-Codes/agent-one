import { useAtom } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  smoothStreamEnabledAtom,
} from "@/lib/jotai/settings-atoms";

export default function StreamingSection() {
  const [smoothStreamEnabled, setSmoothStreamEnabled] = useAtom(
    smoothStreamEnabledAtom,
  );
  const [experimentalThrottleEnabled, setExperimentalThrottleEnabled] = useAtom(
    experimentalThrottleEnabledAtom,
  );
  const [experimentalThrottleValue, setExperimentalThrottleValue] = useAtom(
    experimentalThrottleValueAtom,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streaming</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Smooth Stream</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Enable smooth streaming for a more fluid typing experience.
            </p>
          </div>
          <Switch
            checked={smoothStreamEnabled}
            onCheckedChange={setSmoothStreamEnabled}
            aria-label="Toggle smooth stream"
          />
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Experimental Throttle</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Enable throttling to control streaming speed.
            </p>
          </div>
          <Switch
            checked={experimentalThrottleEnabled}
            onCheckedChange={setExperimentalThrottleEnabled}
            aria-label="Toggle experimental throttle"
          />
        </div>

        {experimentalThrottleEnabled && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-start">
              <label className="text-sm font-medium tabular-nums">
                Throttle Value: {experimentalThrottleValue}ms
              </label>
              <p className="text-muted-foreground mt-1 text-sm">
                Adjust the throttle delay from 0ms to 10,000ms.
              </p>
            </div>
            <Slider
              value={[experimentalThrottleValue]}
              onValueChange={(value) => setExperimentalThrottleValue(value[0])}
              min={0}
              max={10000}
              step={10}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
