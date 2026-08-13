import { IconRestore } from "@tabler/icons-react";
import { useAtom } from "jotai";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  chatVirtualizationModeAtom,
  chatVirtualizationThresholdAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

import SettingsTarget from "../settings-target";

export default function PerformanceSection() {
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(maxCodeblockCharsAtom);
  const [maxToolResultChars, setMaxToolResultChars] = useAtom(maxToolResultCharsAtom);
  const [chatVirtualizationMode, setChatVirtualizationMode] = useAtom(chatVirtualizationModeAtom);
  const [chatVirtualizationThreshold, setChatVirtualizationThreshold] = useAtom(
    chatVirtualizationThresholdAtom,
  );
  const [mcpParallelLoadLimit, setMcpParallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);

  const isMaxMessageLengthDefault = maxMessageLength === DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH;
  const isMaxCodeblockCharsDefault = maxCodeblockChars === DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS;
  const isMaxToolResultCharsDefault = maxToolResultChars === DEFAULT_SETTINGS.MAX_TOOL_RESULT_CHARS;
  const isChatVirtualizationModeDefault =
    chatVirtualizationMode === DEFAULT_SETTINGS.CHAT_VIRTUALIZATION_MODE;
  const isChatVirtualizationThresholdDefault =
    chatVirtualizationThreshold === DEFAULT_SETTINGS.CHAT_VIRTUALIZATION_THRESHOLD;
  const isMcpParallelLoadLimitDefault =
    mcpParallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rendering Limits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-max-message-length">
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
                  onChange={(e) => {
                    trackSettingsInteraction("performance", "max_message_length_changed", {
                      value: parseInt(e.target.value) || 50000,
                    });
                    setMaxMessageLength(parseInt(e.target.value) || 50000);
                  }}
                  className="w-full md:w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("performance", "reset_max_message_length");
                    resetSetting("MAX_MESSAGE_LENGTH");
                  }}
                  disabled={isMaxMessageLengthDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-max-codeblock-characters">
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
                  onChange={(e) => {
                    trackSettingsInteraction("performance", "max_codeblock_chars_changed", {
                      value: parseInt(e.target.value) || 10000,
                    });
                    setMaxCodeblockChars(parseInt(e.target.value) || 10000);
                  }}
                  className="w-full md:w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("performance", "reset_max_codeblock_chars");
                    resetSetting("MAX_CODEBLOCK_CHARS");
                  }}
                  disabled={isMaxCodeblockCharsDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          <SettingsTarget id="setting-max-tool-result-characters">
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
                  onChange={(e) => {
                    trackSettingsInteraction("performance", "max_tool_result_chars_changed", {
                      value: parseInt(e.target.value) || 15000,
                    });
                    setMaxToolResultChars(parseInt(e.target.value) || 15000);
                  }}
                  className="w-full md:w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("performance", "reset_max_tool_result_chars");
                    resetSetting("MAX_TOOL_RESULT_CHARS");
                  }}
                  disabled={isMaxToolResultCharsDefault}
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
          <CardTitle>Chat Virtualization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SettingsTarget id="setting-virtualize-chat-messages">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor="chat-virtualization-enabled" className="text-sm font-medium">
                  Virtualize Chat Messages
                </Label>
                <p className="text-muted-foreground text-sm">
                  Reduce rendering work for large chats while preserving the same chat UI behavior.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="chat-virtualization-enabled"
                  checked={chatVirtualizationMode !== "off"}
                  onCheckedChange={(checked) => {
                    trackSettingsInteraction("performance", "chat_virtualization_toggled", {
                      enabled: checked,
                    });
                    setChatVirtualizationMode(checked ? "threshold" : "off");
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("performance", "reset_chat_virtualization_mode");
                    resetSetting("CHAT_VIRTUALIZATION_MODE");
                  }}
                  disabled={isChatVirtualizationModeDefault}
                  aria-label="Reset chat virtualization mode"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>

          {chatVirtualizationMode !== "off" && (
            <SettingsTarget id="setting-message-count-threshold">
              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div className="flex flex-1 flex-col items-start">
                  <Label htmlFor="chat-virtualization-threshold" className="text-sm font-medium">
                    Message Count Threshold
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Only enable chat virtualization when a conversation reaches at least this many
                    messages.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="chat-virtualization-threshold"
                    type="number"
                    min="1"
                    max="100000"
                    value={chatVirtualizationThreshold}
                    onChange={(e) => {
                      const value = Math.max(1, parseInt(e.target.value) || 1);
                      trackSettingsInteraction(
                        "performance",
                        "chat_virtualization_threshold_changed",
                        { value },
                      );
                      setChatVirtualizationThreshold(value);
                    }}
                    className="w-full md:w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      trackSettingsInteraction(
                        "performance",
                        "reset_chat_virtualization_threshold",
                      );
                      resetSetting("CHAT_VIRTUALIZATION_THRESHOLD");
                    }}
                    disabled={isChatVirtualizationThresholdDefault}
                    aria-label="Reset chat virtualization threshold"
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
          <CardTitle>Extension Runtime</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsTarget id="setting-mcp-parallel-load-limit">
            <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col items-start">
                <Label htmlFor="mcp-parallel-load-limit" className="text-sm font-medium">
                  MCP Parallel Load Limit
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">
                  Maximum number of MCP servers loaded concurrently.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="mcp-parallel-load-limit"
                  type="number"
                  min="1"
                  max="64"
                  value={mcpParallelLoadLimit}
                  onChange={(e) => {
                    const value = Math.max(1, parseInt(e.target.value) || 8);
                    trackSettingsInteraction("performance", "mcp_parallel_load_limit_changed", {
                      value,
                    });
                    setMcpParallelLoadLimit(value);
                  }}
                  className="w-full md:w-32"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    trackSettingsInteraction("performance", "reset_mcp_parallel_load_limit");
                    resetSetting("MCP_PARALLEL_LOAD_LIMIT");
                  }}
                  disabled={isMcpParallelLoadLimitDefault}
                  aria-label="Reset to default"
                >
                  <IconRestore data-icon="inline-start" />
                </Button>
              </div>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>
    </div>
  );
}
