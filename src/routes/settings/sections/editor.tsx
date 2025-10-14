import { useAtom } from "jotai";
import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  markdownHighlightingAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import { DEFAULT_SETTINGS, type SubmitKeyOption } from "@/lib/settings/types";

export default function EditorSection() {
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(
    markdownHighlightingAtom,
  );
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);

  const isMarkdownHighlightingDefault =
    markdownHighlighting === DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING;
  const isSubmitKeyDefault = submitKey === DEFAULT_SETTINGS.SUBMIT_KEY;

  const handleResetMarkdownHighlighting = () => {
    resetSetting("MARKDOWN_HIGHLIGHTING");
  };

  const handleResetSubmitKey = () => {
    resetSetting("SUBMIT_KEY");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Markdown Highlighting</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              When enabled, text formatting like **bold**, *italic*, and `code`
              will be visually highlighted as you type. When disabled, you'll
              see plain text without any special formatting colors or styles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={markdownHighlighting}
              onCheckedChange={setMarkdownHighlighting}
              aria-label="Toggle markdown highlighting"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetMarkdownHighlighting}
              disabled={isMarkdownHighlightingDefault}
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
              <SelectTrigger className="w-full md:w-fit md:max-w-96">
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
              onClick={handleResetSubmitKey}
              disabled={isSubmitKeyDefault}
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
