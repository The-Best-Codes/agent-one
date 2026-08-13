import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  chatSortAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  extractReasoningEnabledAtom,
  markdownRenderingAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  remendEnabledAtom,
  showChatStatusIndicatorAtom,
  showMessageActionRowAtom,
  showChatToBottomButtonAtom,
  showMessagePreviewRailAtom,
  smoothStreamEnabledAtom,
  stopButtonBehaviorAtom,
  submitKeyAtom,
  titleGenerationAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  type ChatSortOption,
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type MessageActionRowOption,
  type NotificationOption,
  type SubmitKeyOption,
  type TitleGenerationMethodOption,
} from "@/lib/settings/types";

import SettingsTarget from "../settings-target";

export default function ChatsSection() {
  const [markdownRendering, setMarkdownRendering] = useAtom(markdownRenderingAtom);
  const [notificationSetting, setNotificationSetting] = useAtom(notificationSettingAtom);
  const [showMessageActionRow, setShowMessageActionRow] = useAtom(showMessageActionRowAtom);
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);
  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);
  const [remendEnabled, setRemendEnabled] = useAtom(remendEnabledAtom);
  const [smoothStreamEnabled, setSmoothStreamEnabled] = useAtom(smoothStreamEnabledAtom);
  const [extractReasoningEnabled, setExtractReasoningEnabled] = useAtom(
    extractReasoningEnabledAtom,
  );
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
  const [showChatToBottomButton, setShowChatToBottomButton] = useAtom(showChatToBottomButtonAtom);
  const [showMessagePreviewRail, setShowMessagePreviewRail] = useAtom(showMessagePreviewRailAtom);
  const [chatSort, setChatSort] = useAtom(chatSortAtom);
  const [titleGeneration, setTitleGeneration] = useAtom(titleGenerationAtom);

  const isMarkdownRenderingDefault = markdownRendering === DEFAULT_SETTINGS.MARKDOWN_RENDERING;
  const isNotificationSettingDefault =
    notificationSetting === DEFAULT_SETTINGS.NOTIFICATION_SETTING;
  const isShowMessageActionRowDefault =
    showMessageActionRow === DEFAULT_SETTINGS.SHOW_MESSAGE_ACTION_ROW;
  const isSubmitKeyDefault = submitKey === DEFAULT_SETTINGS.SUBMIT_KEY;
  const isRegenerateOnSaveDefault = regenerateOnSave === DEFAULT_SETTINGS.REGENERATE_ON_SAVE;
  const isRemendEnabledDefault = remendEnabled === DEFAULT_SETTINGS.REMEND_ENABLED;
  const isSmoothStreamDefault = smoothStreamEnabled === DEFAULT_SETTINGS.SMOOTH_STREAM_ENABLED;
  const isExtractReasoningDefault =
    extractReasoningEnabled === DEFAULT_SETTINGS.EXTRACT_REASONING_ENABLED;
  const isExperimentalThrottleEnabledDefault =
    experimentalThrottleEnabled === DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_ENABLED;
  const isExperimentalThrottleValueDefault =
    experimentalThrottleValue === DEFAULT_SETTINGS.EXPERIMENTAL_THROTTLE_VALUE;
  const isAlwaysShowStopButtonDefault =
    alwaysShowStopButton === DEFAULT_SETTINGS.STOP_BUTTON_BEHAVIOR;
  const isShowChatStatusIndicatorDefault =
    showChatStatusIndicator === DEFAULT_SETTINGS.SHOW_CHAT_STATUS_INDICATOR;
  const isShowChatToBottomButtonDefault =
    showChatToBottomButton === DEFAULT_SETTINGS.SHOW_CHAT_TO_BOTTOM_BUTTON;
  const isShowMessagePreviewRailDefault =
    showMessagePreviewRail === DEFAULT_SETTINGS.SHOW_MESSAGE_PREVIEW_RAIL;
  const isChatSortDefault = chatSort === DEFAULT_SETTINGS.CHAT_SORT;
  const isTitleGenerationDefault =
    JSON.stringify(titleGeneration) === JSON.stringify(DEFAULT_SETTINGS.TITLE_GENERATION);

  const updateTitleGeneration = (updates: Partial<typeof DEFAULT_SETTINGS.TITLE_GENERATION>) => {
    setTitleGeneration((prev) => ({ ...prev, ...updates }));
  };

  const titleMaxOutputTokens = titleGeneration.maxOutputTokens ?? 1024;
  const titleMaxOutputTokenValue = titleMaxOutputTokens === "none" ? 0 : titleMaxOutputTokens;
  const titleMaxOutputTokenLabel =
    titleMaxOutputTokens === "none" ? "No limit" : titleMaxOutputTokens.toLocaleString();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Behavior</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-chat-sort-order">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Chat Sort Order</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Choose whether the sidebar keeps newer chats first or brings recently updated
                  chats to the top.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={chatSort}
                  onValueChange={(value) => {
                    trackSettingsInteraction("chats", "chat_sort_changed", { value });
                    setChatSort(value as ChatSortOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select chat sort order"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="created-at">Newest chats first</SelectItem>
                      <SelectItem value="updated-at">Recently updated first</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_chat_sort");
                    resetSetting("CHAT_SORT");
                  }}
                  disabled={isChatSortDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-markdown-rendering">
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
                  onValueChange={(value) => {
                    trackSettingsInteraction("chats", "markdown_rendering_changed", { value });
                    setMarkdownRendering(value as MarkdownRenderingOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select markdown rendering"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="both">All messages</SelectItem>
                      <SelectItem value="user">User messages only</SelectItem>
                      <SelectItem value="assistant">Assistant messages only</SelectItem>
                      <SelectItem value="neither">No messages</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_markdown_rendering");
                    resetSetting("MARKDOWN_RENDERING");
                  }}
                  disabled={isMarkdownRenderingDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-remend">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Fix Streaming Markdown</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Automatically fix incomplete formatting in streamed responses.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={remendEnabled}
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "remend_toggled", {
                      enabled: checked,
                    });
                    setRemendEnabled(checked);
                  }}
                  aria-label="Toggle auto-close HTML tags"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_remend");
                    resetSetting("REMEND_ENABLED");
                  }}
                  disabled={isRemendEnabledDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-completion-notification">
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
                  onValueChange={(value) => {
                    trackSettingsInteraction("chats", "notification_setting_changed", { value });
                    setNotificationSetting(value as NotificationOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select completion notification"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="always">Always</SelectItem>
                      <SelectItem value="when-unfocused">When window unfocused</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_notification_setting");
                    resetSetting("NOTIFICATION_SETTING");
                  }}
                  disabled={isNotificationSettingDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-message-action-row">
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
                  onValueChange={(value) => {
                    trackSettingsInteraction("chats", "message_action_row_changed", { value });
                    setShowMessageActionRow(value as MessageActionRowOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select message action row"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="hover">Show on hover</SelectItem>
                      <SelectItem value="always">Always show</SelectItem>
                      <SelectItem value="never">Never show</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_message_action_row");
                    resetSetting("SHOW_MESSAGE_ACTION_ROW");
                  }}
                  disabled={isShowMessageActionRowDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-submit-key">
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
                  onValueChange={(value) => {
                    trackSettingsInteraction("chats", "submit_key_changed", { value });
                    setSubmitKey(value as SubmitKeyOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select submit key"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="enter">Enter</SelectItem>
                      <SelectItem value="ctrl-enter">Ctrl + Enter</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_submit_key");
                    resetSetting("SUBMIT_KEY");
                  }}
                  disabled={isSubmitKeyDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-regenerate-on-save">
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
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "regenerate_on_save_toggled", {
                      enabled: checked,
                    });
                    setRegenerateOnSave(checked);
                  }}
                  aria-label="Toggle regenerate on save"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_regenerate_on_save");
                    resetSetting("REGENERATE_ON_SAVE");
                  }}
                  disabled={isRegenerateOnSaveDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-always-show-stop-button">
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
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "stop_button_behavior_toggled", {
                      enabled: checked,
                    });
                    setAlwaysShowStopButton(checked ? "immediate" : "at-stopping-point");
                  }}
                  aria-label="Toggle always show stop button"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_stop_button_behavior");
                    resetSetting("STOP_BUTTON_BEHAVIOR");
                  }}
                  disabled={isAlwaysShowStopButtonDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-show-scroll-to-bottom-button">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Chat Scroll to Bottom Button</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Show a button to quickly scroll to the bottom of the chat.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showChatToBottomButton}
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "chat_scroll_to_bottom_button_toggled", {
                      enabled: checked,
                    });
                    setShowChatToBottomButton(checked);
                  }}
                  aria-label="Toggle chat scroll to bottom button"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_chat_scroll_to_bottom_button");
                    resetSetting("SHOW_CHAT_TO_BOTTOM_BUTTON");
                  }}
                  disabled={isShowChatToBottomButtonDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-show-message-preview-rail">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Message Navigation Rail</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Show message previews and navigation on the right side of chats. Hidden in the
                  compact layout.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showMessagePreviewRail}
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "message_preview_rail_toggled", {
                      enabled: checked,
                    });
                    setShowMessagePreviewRail(checked);
                  }}
                  aria-label="Toggle message navigation rail"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_message_preview_rail");
                    resetSetting("SHOW_MESSAGE_PREVIEW_RAIL");
                  }}
                  disabled={isShowMessagePreviewRailDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-chat-status-indicators">
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
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "chat_status_indicators_toggled", {
                      enabled: checked,
                    });
                    setShowChatStatusIndicator(checked);
                  }}
                  aria-label="Toggle chat status indicators"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_chat_status_indicators");
                    resetSetting("SHOW_CHAT_STATUS_INDICATOR");
                  }}
                  disabled={isShowChatStatusIndicatorDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Streaming Experience</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-smooth-stream">
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
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "smooth_stream_toggled", {
                      enabled: checked,
                    });
                    setSmoothStreamEnabled(checked);
                  }}
                  aria-label="Toggle smooth stream"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_smooth_stream");
                    resetSetting("SMOOTH_STREAM_ENABLED");
                  }}
                  disabled={isSmoothStreamDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-extract-reasoning">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Extract Reasoning from Think Tags</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Automatically extract <Kbd>&lt;think&gt;</Kbd> tag content from model responses
                  and display it as a collapsible reasoning section. Does not apply to past messages
                  or non-reasoning models.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={extractReasoningEnabled}
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "extract_reasoning_toggled", {
                      enabled: checked,
                    });
                    setExtractReasoningEnabled(checked);
                  }}
                  aria-label="Toggle extract reasoning from think tags"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_extract_reasoning");
                    resetSetting("EXTRACT_REASONING_ENABLED");
                  }}
                  disabled={isExtractReasoningDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-experimental-throttle">
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
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("chats", "experimental_throttle_toggled", {
                      enabled: checked,
                    });
                    setExperimentalThrottleEnabled(checked);
                  }}
                  aria-label="Toggle experimental throttle"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("chats", "reset_experimental_throttle");
                    resetSetting("EXPERIMENTAL_THROTTLE_ENABLED");
                  }}
                  disabled={isExperimentalThrottleEnabledDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          {experimentalThrottleEnabled && (
            <SettingsTarget id="setting-throttle-value">
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
                      trackSettingsInteraction("chats", "experimental_throttle_value_changed", {
                        value: value[0],
                      });
                      setExperimentalThrottleValue(value[0]);
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
                    onClick={() => {
                      trackSettingsInteraction("chats", "reset_experimental_throttle_value");
                      resetSetting("EXPERIMENTAL_THROTTLE_VALUE");
                    }}
                    disabled={isExperimentalThrottleValueDefault}
                    aria-label="Reset to default"
                  >
                    <IconRestore data-icon="inline-start" />
                  </Button>
                </div>
              </div>
            </SettingsTarget>
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
              onClick={() => {
                trackSettingsInteraction("chats", "reset_title_generation");
                resetSetting("TITLE_GENERATION");
              }}
              disabled={isTitleGenerationDefault}
              aria-label="Reset all title settings to default"
            >
              <IconRestore data-icon="inline-start" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-generation-method">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Generation Method</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  How chat titles should be generated.
                </p>
              </div>
              <Select
                value={titleGeneration.method}
                onValueChange={(value) => {
                  trackSettingsInteraction("chats", "title_generation_method_changed", { value });
                  updateTitleGeneration({
                    method: value as TitleGenerationMethodOption,
                  });
                }}
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
          </SettingsTarget>

          {(titleGeneration.method === "first-user-message" ||
            titleGeneration.method === "first-assistant-message") && (
            <SettingsTarget id="setting-character-limit">
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
                  onChange={(e) => {
                    trackSettingsInteraction("chats", "title_character_limit_changed", {
                      value: parseInt(e.target.value) || 50,
                    });
                    updateTitleGeneration({
                      characterLimit: parseInt(e.target.value) || 50,
                    });
                  }}
                  className="w-full md:w-32"
                />
              </div>
            </SettingsTarget>
          )}

          {titleGeneration.method === "ai" && (
            <SettingsTarget id="setting-title-max-output-tokens">
              <div className="flex flex-col gap-2">
                <div className="flex flex-1 flex-col items-start">
                  <Label className="text-sm font-medium tabular-nums">
                    Max Output Tokens: {titleMaxOutputTokenLabel}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Maximum tokens available for AI title generation. Use no limit if title
                    generation fails with thinking models. Manually generated titles don't respect
                    this setting.
                  </p>
                </div>
                <Slider
                  value={[titleMaxOutputTokenValue]}
                  onValueChange={(value) => {
                    const maxOutputTokens = value[0] === 0 ? "none" : value[0];
                    trackSettingsInteraction("chats", "title_max_output_tokens_changed", {
                      value: maxOutputTokens,
                    });
                    updateTitleGeneration({ maxOutputTokens });
                  }}
                  min={0}
                  max={64000}
                  step={64}
                  className="w-full"
                  aria-label="Title generation max output tokens"
                />
              </div>
            </SettingsTarget>
          )}

          {titleGeneration.method === "custom" && (
            <SettingsTarget id="setting-custom-phrase">
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
                  onChange={(e) => {
                    trackSettingsInteraction("chats", "title_custom_phrase_changed", {
                      value_length: e.target.value.length,
                    });
                    updateTitleGeneration({
                      customPhrase: e.target.value,
                    });
                  }}
                  placeholder="New chat"
                  className="w-full md:w-64"
                />
              </div>
            </SettingsTarget>
          )}

          {titleGeneration.method !== "custom" && (
            <SettingsTarget id="setting-fallback-phrase">
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
                  onChange={(e) => {
                    trackSettingsInteraction("chats", "title_fallback_phrase_changed", {
                      value_length: e.target.value.length,
                    });
                    updateTitleGeneration({
                      fallbackPhrase: e.target.value,
                    });
                  }}
                  placeholder="New chat"
                  className="w-full md:w-64"
                />
              </div>
            </SettingsTarget>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
