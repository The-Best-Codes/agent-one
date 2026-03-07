import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
  maxToolResultCharsAtom,
  mcpParallelLoadLimitAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS } from "@/lib/settings/types";

export default function PerformanceSection() {
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(maxCodeblockCharsAtom);
  const [maxToolResultChars, setMaxToolResultChars] = useAtom(maxToolResultCharsAtom);
  const [mcpParallelLoadLimit, setMcpParallelLoadLimit] = useAtom(mcpParallelLoadLimitAtom);

  const isMaxMessageLengthDefault = maxMessageLength === DEFAULT_SETTINGS.MAX_MESSAGE_LENGTH;
  const isMaxCodeblockCharsDefault = maxCodeblockChars === DEFAULT_SETTINGS.MAX_CODEBLOCK_CHARS;
  const isMaxToolResultCharsDefault = maxToolResultChars === DEFAULT_SETTINGS.MAX_TOOL_RESULT_CHARS;
  const isMcpParallelLoadLimitDefault =
    mcpParallelLoadLimit === DEFAULT_SETTINGS.MCP_PARALLEL_LOAD_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rendering Limits</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
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
                onClick={() => resetSetting("MAX_MESSAGE_LENGTH")}
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
                onClick={() => resetSetting("MAX_CODEBLOCK_CHARS")}
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
                onClick={() => resetSetting("MAX_TOOL_RESULT_CHARS")}
                disabled={isMaxToolResultCharsDefault}
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
          <CardTitle>Extension Runtime</CardTitle>
        </CardHeader>
        <CardContent>
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
                onChange={(e) =>
                  setMcpParallelLoadLimit(Math.max(1, parseInt(e.target.value) || 8))
                }
                className="w-full md:w-32"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSetting("MCP_PARALLEL_LOAD_LIMIT")}
                disabled={isMcpParallelLoadLimitDefault}
                aria-label="Reset to default"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
