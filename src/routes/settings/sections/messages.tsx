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
import {
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  notificationSettingAtom,
  showMessageActionRowAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type MarkdownRenderingOption,
  type MessageActionRowOption,
  type NotificationOption,
} from "@/lib/settings/types";

export default function MessagesSection() {
  const [markdownRendering, setMarkdownRendering] = useAtom(markdownRenderingAtom);
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(maxCodeblockCharsAtom);
  const [maxToolResultChars, setMaxToolResultChars] = useAtom(maxToolResultCharsAtom);
  const [notificationSetting, setNotificationSetting] = useAtom(notificationSettingAtom);
  const [showMessageActionRow, setShowMessageActionRow] = useAtom(showMessageActionRowAtom);

  const isMarkdownRenderingDefault = markdownRendering === DEFAULT_SETTINGS.MARKDOWN_RENDERING;
  const isMaxMessageLengthDefault = maxMessageLength === DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH;
  const isMaxCodeblockCharsDefault = maxCodeblockChars === DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS;
  const isMaxToolResultCharsDefault = maxToolResultChars === DEFAULT_SETTINGS.MAX_TOOL_RESULT_CHARS;
  const isNotificationSettingDefault =
    notificationSetting === DEFAULT_SETTINGS.NOTIFICATION_SETTING;
  const isShowMessageActionRowDefault =
    showMessageActionRow === DEFAULT_SETTINGS.SHOW_MESSAGE_ACTION_ROW;

  const handleResetMarkdownRendering = () => {
    resetSetting("MARKDOWN_RENDERING");
  };

  const handleResetMaxMessageLength = () => {
    resetSetting("MAX_MESSAGE_LENGTH");
  };

  const handleResetMaxCodeblockChars = () => {
    resetSetting("MAX_CODEBLOCK_CHARS");
  };

  const handleResetMaxToolResultChars = () => {
    resetSetting("MAX_TOOL_RESULT_CHARS");
  };

  const handleResetNotificationSetting = () => {
    resetSetting("NOTIFICATION_SETTING");
  };

  const handleResetShowMessageActionRow = () => {
    resetSetting("SHOW_MESSAGE_ACTION_ROW");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
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
              onClick={handleResetMarkdownRendering}
              disabled={isMarkdownRenderingDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label htmlFor="max-message-length" className="text-sm font-medium">
              Max Message Length
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters before activating performance mode for that message.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="max-message-length"
              type="number"
              min="1000"
              max="1000000"
              value={maxMessageLength}
              onChange={(e) => setMaxMessageLength(parseInt(e.target.value) || 50000)}
              className="w-full md:w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMaxMessageLength}
              disabled={isMaxMessageLengthDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label htmlFor="max-codeblock-chars" className="text-sm font-medium">
              Max Codeblock Characters
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters in code blocks before switching to plain text rendering.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="max-codeblock-chars"
              type="number"
              min="1000"
              max="1000000"
              value={maxCodeblockChars}
              onChange={(e) => setMaxCodeblockChars(parseInt(e.target.value) || 10000)}
              className="w-full md:w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMaxCodeblockChars}
              disabled={isMaxCodeblockCharsDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label htmlFor="max-tool-result-chars" className="text-sm font-medium">
              Max Tool Result Characters
            </Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters in tool results before switching to performant rendering.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="max-tool-result-chars"
              type="number"
              min="1000"
              max="1000000"
              value={maxToolResultChars}
              onChange={(e) => setMaxToolResultChars(parseInt(e.target.value) || 15000)}
              className="w-full md:w-32"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMaxToolResultChars}
              disabled={isMaxToolResultCharsDefault}
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
              onClick={handleResetNotificationSetting}
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
              onClick={handleResetShowMessageActionRow}
              disabled={isShowMessageActionRowDefault}
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
