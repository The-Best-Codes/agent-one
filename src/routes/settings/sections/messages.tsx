import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

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
import {
  markdownRenderingAtom,
  maxCodeblockCharsAtom,
  maxMessageLengthAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { type MarkdownRenderingOption } from "@/lib/settings/types";

export default function MessagesSection() {
  const [markdownRendering, setMarkdownRendering] = useAtom(
    markdownRenderingAtom,
  );
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(
    maxCodeblockCharsAtom,
  );

  const handleResetMarkdownRendering = () => {
    resetSetting("MARKDOWN_RENDERING");
  };

  const handleResetMaxMessageLength = () => {
    resetSetting("MAX_MESSAGE_LENGTH");
  };

  const handleResetMaxCodeblockChars = () => {
    resetSetting("MAX_CODEBLOCK_CHARS");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-sm font-medium">Markdown Rendering</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose which messages should render markdown formatting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={markdownRendering}
              onValueChange={(value) =>
                setMarkdownRendering(value as MarkdownRenderingOption)
              }
            >
              <SelectTrigger size="sm" className="w-full md:w-fit md:max-w-96">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMarkdownRendering}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-sm font-medium">Max Message Length</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters before activating performance mode for that
              message.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMaxMessageLength}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-sm font-medium">
              Max Codeblock Characters
            </label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters in code blocks before switching to plain text
              rendering.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMaxCodeblockChars}
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
