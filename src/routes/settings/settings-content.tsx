import { useAtom } from "jotai";
import { Link } from "react-router";

import ThemeToggle from "@/components/theme/toggle-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  markdownHighlightingAtom,
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  smoothStreamEnabledAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import {
  type MarkdownRenderingOption,
  type SubmitKeyOption,
} from "@/lib/settings/types";

interface SettingsContentProps {
  activeSection: string;
}

export default function SettingsContent({
  activeSection,
}: SettingsContentProps) {
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(
    markdownHighlightingAtom,
  );
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);
  const [markdownRendering, setMarkdownRendering] = useAtom(
    markdownRenderingAtom,
  );
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(
    maxCodeblockCharsAtom,
  );
  const [smoothStreamEnabled, setSmoothStreamEnabled] = useAtom(
    smoothStreamEnabledAtom,
  );
  const [experimentalThrottleEnabled, setExperimentalThrottleEnabled] = useAtom(
    experimentalThrottleEnabledAtom,
  );
  const [experimentalThrottleValue, setExperimentalThrottleValue] = useAtom(
    experimentalThrottleValueAtom,
  );

  const renderSection = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose your preferred theme for the application.
                  </p>
                </div>
                <ThemeToggle className="w-full md:max-w-64" />
              </div>
            </CardContent>
          </Card>
        );

      case "editor":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Markdown Highlighting
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    When enabled, text formatting like **bold**, *italic*, and
                    `code` will be visually highlighted as you type. When
                    disabled, you'll see plain text without any special
                    formatting colors or styles.
                  </p>
                </div>
                <Switch
                  checked={markdownHighlighting}
                  onCheckedChange={setMarkdownHighlighting}
                  aria-label="Toggle markdown highlighting"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">Submit Key</label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose which key combination submits your message.
                  </p>
                </div>
                <Select
                  value={submitKey}
                  onValueChange={(value) =>
                    setSubmitKey(value as SubmitKeyOption)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full md:w-fit md:max-w-96"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enter">Enter</SelectItem>
                    <SelectItem value="ctrl-enter">Ctrl + Enter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case "messages":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Markdown Rendering
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose which messages should render markdown formatting.
                  </p>
                </div>
                <Select
                  value={markdownRendering}
                  onValueChange={(value) =>
                    setMarkdownRendering(value as MarkdownRenderingOption)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full md:w-fit md:max-w-96"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">All messages</SelectItem>
                    <SelectItem value="user">User messages only</SelectItem>
                    <SelectItem value="assistant">
                      Assistant messages only
                    </SelectItem>
                    <SelectItem value="neither">No messages</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Max Message Length
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Maximum characters before activating performance mode for
                    that message.
                  </p>
                </div>
                <Input
                  type="number"
                  min="1000"
                  max="1000000"
                  value={maxMessageLength}
                  onChange={(e) =>
                    setMaxMessageLength(parseInt(e.target.value) || 50000)
                  }
                  className="w-full md:w-32"
                />
              </div>

              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Max Codeblock Characters
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Maximum characters in code blocks before switching to plain
                    text rendering.
                  </p>
                </div>
                <Input
                  type="number"
                  min="1000"
                  max="1000000"
                  value={maxCodeblockChars}
                  onChange={(e) =>
                    setMaxCodeblockChars(parseInt(e.target.value) || 10000)
                  }
                  className="w-full md:w-32"
                />
              </div>
            </CardContent>
          </Card>
        );

      case "streaming":
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
                  <label className="text-sm font-medium">
                    Experimental Throttle
                  </label>
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
                    onValueChange={(value) =>
                      setExperimentalThrottleValue(value[0])
                    }
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

      case "about":
        return (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/credits">View Credits and Licenses</Link>
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  return <div className="space-y-2">{renderSection()}</div>;
}
