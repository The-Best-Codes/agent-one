import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  chatSortAtom,
  extractReasoningEnabledAtom,
  interruptKeyAtom,
  markdownRenderingAtom,
  notificationSettingAtom,
  regenerateOnSaveAtom,
  remendEnabledAtom,
  showChatStatusIndicatorAtom,
  sidebarChatTimeGroupingAtom,
  showMessageActionRowAtom,
  showChatToBottomButtonAtom,
  showMessagePreviewRailAtom,
  submitKeyAtom,
  throttleValueAtom,
  titleGenerationAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  type ChatSortOption,
  DEFAULT_SETTINGS,
  type InterruptKeyOption,
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
  const [interruptKey, setInterruptKey] = useAtom(interruptKeyAtom);
  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);
  const [remendEnabled, setRemendEnabled] = useAtom(remendEnabledAtom);
  const [extractReasoningEnabled, setExtractReasoningEnabled] = useAtom(
    extractReasoningEnabledAtom,
  );
  const [throttleValue, setThrottleValue] = useAtom(throttleValueAtom);
  const [showChatStatusIndicator, setShowChatStatusIndicator] = useAtom(
    showChatStatusIndicatorAtom,
  );
  const [showChatToBottomButton, setShowChatToBottomButton] = useAtom(showChatToBottomButtonAtom);
  const [showMessagePreviewRail, setShowMessagePreviewRail] = useAtom(showMessagePreviewRailAtom);
  const [chatSort, setChatSort] = useAtom(chatSortAtom);
  const [sidebarChatTimeGrouping, setSidebarChatTimeGrouping] = useAtom(
    sidebarChatTimeGroupingAtom,
  );
  const [titleGeneration, setTitleGeneration] = useAtom(titleGenerationAtom);

  const isMarkdownRenderingDefault = markdownRendering === DEFAULT_SETTINGS.MARKDOWN_RENDERING;
  const isNotificationSettingDefault =
    notificationSetting === DEFAULT_SETTINGS.NOTIFICATION_SETTING;
  const isShowMessageActionRowDefault =
    showMessageActionRow === DEFAULT_SETTINGS.SHOW_MESSAGE_ACTION_ROW;
  const isSubmitKeyDefault = submitKey === DEFAULT_SETTINGS.SUBMIT_KEY;
  const isInterruptKeyDefault = interruptKey === DEFAULT_SETTINGS.INTERRUPT_KEY;
  const isRegenerateOnSaveDefault = regenerateOnSave === DEFAULT_SETTINGS.REGENERATE_ON_SAVE;
  const isRemendEnabledDefault = remendEnabled === DEFAULT_SETTINGS.REMEND_ENABLED;
  const isExtractReasoningDefault =
    extractReasoningEnabled === DEFAULT_SETTINGS.EXTRACT_REASONING_ENABLED;
  const isThrottleValueDefault = throttleValue === DEFAULT_SETTINGS.THROTTLE_VALUE;
  const isShowChatStatusIndicatorDefault =
    showChatStatusIndicator === DEFAULT_SETTINGS.SHOW_CHAT_STATUS_INDICATOR;
  const isShowChatToBottomButtonDefault =
    showChatToBottomButton === DEFAULT_SETTINGS.SHOW_CHAT_TO_BOTTOM_BUTTON;
  const isShowMessagePreviewRailDefault =
    showMessagePreviewRail === DEFAULT_SETTINGS.SHOW_MESSAGE_PREVIEW_RAIL;
  const isChatSortDefault = chatSort === DEFAULT_SETTINGS.CHAT_SORT;
  const isSidebarChatTimeGroupingDefault =
    sidebarChatTimeGrouping === DEFAULT_SETTINGS.SIDEBAR_CHAT_TIME_GROUPING;
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

          <SettingsTarget id="setting-sidebar-chat-time-grouping">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Group sidebar chats by time</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Organize chats into time sections such as Recent, Last Week, and monthly groups.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={sidebarChatTimeGrouping}
                  onCheckedChange={(checked) => {
                    setSidebarChatTimeGrouping(checked);
                  }}
                  aria-label="Group sidebar chats by time"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    resetSetting("SIDEBAR_CHAT_TIME_GROUPING");
                  }}
                  disabled={isSidebarChatTimeGroupingDefault}
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
                    setRemendEnabled(checked);
                  }}
                  aria-label="Toggle auto-close HTML tags"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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
                <Label className="text-sm font-medium">Agent Notifications</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Show a notification when AgentOne responds or needs your attention.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={notificationSetting}
                  onValueChange={(value) => {
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
                      <SelectItem value="ctrl-enter">Ctrl/CMD + Enter</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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

          <SettingsTarget id="setting-interrupt-key">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Interrupt Key</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Choose which key combination stops the response and sends your message.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={interruptKey}
                  onValueChange={(value) => {
                    setInterruptKey(value as InterruptKeyOption);
                  }}
                >
                  <SelectTrigger
                    className="w-full md:w-fit md:max-w-96"
                    aria-label="Select interrupt key"
                  >
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="enter">Enter</SelectItem>
                      <SelectItem value="ctrl-enter">Ctrl/CMD + Enter</SelectItem>
                      <SelectItem value="ctrl-shift-enter">Ctrl/CMD + Shift + Enter</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    resetSetting("INTERRUPT_KEY");
                  }}
                  disabled={isInterruptKeyDefault}
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
                    setRegenerateOnSave(checked);
                  }}
                  aria-label="Toggle regenerate on save"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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
                    setShowChatToBottomButton(checked);
                  }}
                  aria-label="Toggle chat scroll to bottom button"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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
                    setShowMessagePreviewRail(checked);
                  }}
                  aria-label="Toggle message navigation rail"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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
                    setShowChatStatusIndicator(checked);
                  }}
                  aria-label="Toggle chat status indicators"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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
          <SettingsTarget id="setting-extract-reasoning">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-start">
                <Label className="text-sm font-medium">Extract Reasoning from Think Tags</Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  {
                    "Automatically extract <think> tag content from model responses and display it as a collapsible reasoning section. Does not apply to past messages or non-reasoning models."
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={extractReasoningEnabled}
                  onCheckedChange={(checked) => {
                    setExtractReasoningEnabled(checked);
                  }}
                  aria-label="Toggle extract reasoning from think tags"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
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

          <SettingsTarget id="setting-throttle-value">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col items-start">
                <Label className="text-sm font-medium tabular-nums">
                  {`Throttle: ${throttleValue}ms`}
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Control how often streaming messages update the interface.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[throttleValue]}
                  onValueChange={(value) => {
                    setThrottleValue(value[0]);
                  }}
                  min={50}
                  max={1000}
                  step={10}
                  className="flex-1"
                  aria-label="Throttle value"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    resetSetting("THROTTLE_VALUE");
                  }}
                  disabled={isThrottleValueDefault}
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
          <div className="flex items-center justify-between">
            <CardTitle>Chat Titles</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
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
                  <SelectGroup>
                    <SelectItem value="ai">AI generated</SelectItem>
                    <SelectItem value="first-user-message">First user message</SelectItem>
                    <SelectItem value="first-assistant-message">First assistant message</SelectItem>
                    <SelectItem value="custom">Custom phrase</SelectItem>
                  </SelectGroup>
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
                    {`Max Output Tokens: ${titleMaxOutputTokenLabel}`}
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
