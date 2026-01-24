import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  showChatStatusIndicatorAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

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
  const [alwaysShowStopButton, setAlwaysShowStopButton] = useAtom(
    stopButtonBehaviorAtom,
  );
  const [showChatStatusIndicator, setShowChatStatusIndicator] = useAtom(
    showChatStatusIndicatorAtom,
  );

  const isSmoothStreamDefault =
    smoothStreamEnabled === DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED;
  const isExperimentalThrottleEnabledDefault =
    experimentalThrottleEnabled ===
    DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED;
  const isExperimentalThrottleValueDefault =
    experimentalThrottleValue === DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE;
  const isAlwaysShowStopButtonDefault =
    alwaysShowStopButton === DEFAULT_SETTINGS.STOP_BUTTON_BEHAVIOR;
  const isShowChatStatusIndicatorDefault =
    showChatStatusIndicator === DEFAULT_SETTINGS.SHOW_CHAT_STATUS_INDICATOR;

  const handleResetSmoothStream = () => {
    resetSetting("SMOOTH_STREAM_ENABLED");
  };

  const handleResetExperimentalThrottle = () => {
    resetSetting("EXPERIMENTAL_THROTTLE_ENABLED");
  };

  const handleResetThrottleValue = () => {
    resetSetting("EXPERIMENTAL_THROTTLE_VALUE");
  };

  const handleResetAlwaysShowStopButton = () => {
    resetSetting("STOP_BUTTON_BEHAVIOR");
  };

  const handleResetShowChatStatusIndicator = () => {
    resetSetting("SHOW_CHAT_STATUS_INDICATOR");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streaming</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Smooth Stream</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Enable smooth streaming for a more fluid typing experience.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={smoothStreamEnabled}
              onCheckedChange={setSmoothStreamEnabled}
              aria-label="Toggle smooth stream"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetSmoothStream}
              disabled={isSmoothStreamDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Experimental Throttle</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Enable throttling to control streaming speed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={experimentalThrottleEnabled}
              onCheckedChange={setExperimentalThrottleEnabled}
              aria-label="Toggle experimental throttle"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetExperimentalThrottle}
              disabled={isExperimentalThrottleEnabledDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        {experimentalThrottleEnabled && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-start">
              <Label className="text-sm font-medium tabular-nums">
                Throttle Value: {experimentalThrottleValue}ms
              </Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Adjust the throttle delay from 0ms to 10,000ms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[experimentalThrottleValue]}
                onValueChange={(value) =>
                  setExperimentalThrottleValue(value[0])
                }
                min={0}
                max={10000}
                step={10}
                className="flex-1"
                aria-label="Throttle value"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetThrottleValue}
                disabled={isExperimentalThrottleValueDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">
              Always Show Stop Button
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Show the stop button immediately after submitting a message.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={alwaysShowStopButton === "immediate"}
              onCheckedChange={(checked) =>
                setAlwaysShowStopButton(
                  checked ? "immediate" : "at-stopping-point",
                )
              }
              aria-label="Toggle always show stop button"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetAlwaysShowStopButton}
              disabled={isAlwaysShowStopButtonDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">
              Chat Status Indicators
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Show status icons in the sidebar for loading, error, and unread
              chats.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showChatStatusIndicator}
              onCheckedChange={setShowChatStatusIndicator}
              aria-label="Toggle chat status indicators"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetShowChatStatusIndicator}
              disabled={isShowChatStatusIndicatorDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
