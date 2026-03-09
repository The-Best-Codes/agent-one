import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  markdownRenderingAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  showChatStatusIndicatorAtom,
  showMessageActionRowAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
  titleGenerationAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type MessageActionRowOption,
  type NotificationOption,
  type SubmitKeyOption,
  type TitleGenerationMethodOption,
} from "@/lib/settings/types";

export default function ChatsSection() {
  const [markdownRendering, setMarkdownRendering] = useAtom(markdownRenderingAtom);
  const [notificationSetting, setNotificationSetting] = useAtom(notificationSettingAtom);
  const [showMessageActionRow, setShowMessageActionRow] = useAtom(showMessageActionRowAtom);
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);
  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);
  const [smoothStreamEnabled, setSmoothStreamEnabled] = useAtom(smoothStreamEnabledAtom);
  const [experimentalThrottleEnabled, setExperimentalThrottleEnabled] = useAtom(
    experimentalThrottleEnabledAtom,
  );
  const [experimentalThrottleValue, setExperimentalThrottleValue] = useAtom(
    experimentalThrottleValueAtom,
  );
  const [alwaysShowStopButton, setAlwaysShowStopButton] = useAtom(stopButtonBehaviorAtom);
  const [showChatStatusIndicator, setShowChatStatusIndicator] = useAtom(
    showChatStatusIndicatorAtom,
  );
  const [titleGeneration, setTitleGeneration] = useAtom(titleGenerationAtom);

  const isMarkdownRenderingDefault = markdownRendering === DEFAULT_SETTINGS.MARKDOWN_RENDERING;
  const isNotificationSettingDefault =
    notificationSetting === DEFAULT_SETTINGS.NOTIFICATION_SETTING;
  const isShowMessageActionRowDefault =
    showMessageActionRow === DEFAULT_SETTINGS.SHOW_MESSAGE_ACTION_ROW;
  const isSubmitKeyDefault = submitKey === DEFAULT_SETTINGS.SUBMIT_KEY;
  const isRegenerateOnSaveDefault = regenerateOnSave === DEFAULT_SETTINGS.REGENERATE_ON_SAVE;
  const isSmoothStreamDefault = smoothStreamEnabled === DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED;
  const isExperimentalThrottleEnabledDefault =
    experimentalThrottleEnabled === DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED;
  const isExperimentalThrottleValueDefault =
    experimentalThrottleValue === DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE;
  const isAlwaysShowStopButtonDefault =
    alwaysShowStopButton === DEFAULT_SETTINGS.STOP_BUTTON_BEHAVIOR;
  const isShowChatStatusIndicatorDefault =
    showChatStatusIndicator === DEFAULT_SETTINGS.SHOW_CHAT_STATUS_INDICATOR;
  const isTitleGenerationDefault =
    JSON.stringify(titleGeneration) === JSON.stringify(DEFAULT_SETTINGS.TITLE_GENERATION);

  const updateTitleGeneration = (updates: Partial<typeof DEFAULT_SETTINGS.TITLE_GENERATION>) => {
    setTitleGeneration((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Behavior</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Markdown Rendering</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose which messages should render markdown formatting.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={markdownRendering}
                onValueChange={(value) => setMarkdownRendering(value as MarkdownRenderingOption)}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select markdown rendering"
                >
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">All messages</SelectItem>
                  <SelectItem value="user">User messages only</SelectItem>
                  <SelectItem value="assistant">Assistant messages only</SelectItem>
                  <SelectItem value="neither">No messages</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("MARKDOWN_RENDERING")}
                disabled={isMarkdownRenderingDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Completion Notification</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Show notification when AgentOne finishes responding.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={notificationSetting}
                onValueChange={(value) => setNotificationSetting(value as NotificationOption)}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select completion notification"
                >
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always</SelectItem>
                  <SelectItem value="when-unfocused">When window unfocused</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("NOTIFICATION_SETTING")}
                disabled={isNotificationSettingDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Message Action Row</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Control when message actions (copy, edit, etc.) are visible.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={showMessageActionRow}
                onValueChange={(value) => setShowMessageActionRow(value as MessageActionRowOption)}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select message action row"
                >
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hover">Show on hover</SelectItem>
                  <SelectItem value="always">Always show</SelectItem>
                  <SelectItem value="never">Never show</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("SHOW_MESSAGE_ACTION_ROW")}
                disabled={isShowMessageActionRowDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Submit Key</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Choose which key combination submits your message.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={submitKey}
                onValueChange={(value) => setSubmitKey(value as SubmitKeyOption)}
              >
                <SelectTrigger
                  className="w-full md:w-fit md:max-w-96"
                  aria-label="Select submit key"
                >
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enter">Enter</SelectItem>
                  <SelectItem value="ctrl-enter">Ctrl + Enter</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("SUBMIT_KEY")}
                disabled={isSubmitKeyDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Regenerate on Save</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Automatically regenerate the AI response when you save an edited message.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={regenerateOnSave}
                onCheckedChange={setRegenerateOnSave}
                aria-label="Toggle regenerate on save"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("REGENERATE_ON_SAVE")}
                disabled={isRegenerateOnSaveDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Always Show Stop Button</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Show the stop button immediately after submitting a message.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={alwaysShowStopButton === "immediate"}
                onCheckedChange={(checked) =>
                  setAlwaysShowStopButton(checked ? "immediate" : "at-stopping-point")
                }
                aria-label="Toggle always show stop button"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("STOP_BUTTON_BEHAVIOR")}
                disabled={isAlwaysShowStopButtonDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Chat Status Indicators</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Show status icons in the sidebar for loading, error, and unread chats.
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
                onClick={() => resetSetting("SHOW_CHAT_STATUS_INDICATOR")}
                disabled={isShowChatStatusIndicatorDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streaming Experience</CardTitle>
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
                onClick={() => resetSetting("SMOOTH_STREAM_ENABLED")}
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
                onClick={() => resetSetting("EXPERIMENTAL_THROTTLE_ENABLED")}
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
                  onValueChange={(value) => {
                    const nextValue = Array.isArray(value) ? value[0] : value;
                    setExperimentalThrottleValue(nextValue);
                  }}
                  min={0}
                  max={10000}
                  step={10}
                  className="flex-1"
                  aria-label="Throttle value"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => resetSetting("EXPERIMENTAL_THROTTLE_VALUE")}
                  disabled={isExperimentalThrottleValueDefault}
                  aria-label="Reset to default"
                >
                  <RotateCcwIcon className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chat Titles</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => resetSetting("TITLE_GENERATION")}
              disabled={isTitleGenerationDefault}
              aria-label="Reset all title settings to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">Generation Method</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                How chat titles should be generated.
              </p>
            </div>
            <Select
              value={titleGeneration.method}
              onValueChange={(value) =>
                updateTitleGeneration({
                  method: value as TitleGenerationMethodOption,
                })
              }
            >
              <SelectTrigger
                className="w-full md:w-fit md:max-w-96"
                aria-label="Select generation method"
              >
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai">AI generated</SelectItem>
                <SelectItem value="first-user-message">First user message</SelectItem>
                <SelectItem value="first-assistant-message">First assistant message</SelectItem>
                <SelectItem value="custom">Custom phrase</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(titleGeneration.method === "first-user-message" ||
            titleGeneration.method === "first-assistant-message") && (
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label htmlFor="character-limit" className="text-sm font-medium">
                  Character Limit
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Maximum characters to use from the message.
                </p>
              </div>
              <Input
                id="character-limit"
                type="number"
                min="10"
                max="200"
                value={titleGeneration.characterLimit}
                onChange={(e) =>
                  updateTitleGeneration({
                    characterLimit: parseInt(e.target.value) || 50,
                  })
                }
                className="w-full md:w-32"
              />
            </div>
          )}

          {titleGeneration.method === "custom" && (
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label htmlFor="custom-phrase" className="text-sm font-medium">
                  Custom Phrase
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  The phrase to use as the chat title.
                </p>
              </div>
              <Input
                id="custom-phrase"
                type="text"
                value={titleGeneration.customPhrase}
                onChange={(e) =>
                  updateTitleGeneration({
                    customPhrase: e.target.value,
                  })
                }
                placeholder="New chat"
                className="w-full md:w-64"
              />
            </div>
          )}

          {titleGeneration.method !== "custom" && (
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label htmlFor="fallback-phrase" className="text-sm font-medium">
                  Fallback Phrase
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Used when title generation fails or no content is available.
                </p>
              </div>
              <Input
                id="fallback-phrase"
                type="text"
                value={titleGeneration.fallbackPhrase}
                onChange={(e) =>
                  updateTitleGeneration({
                    fallbackPhrase: e.target.value,
                  })
                }
                placeholder="New chat"
                className="w-full md:w-64"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
