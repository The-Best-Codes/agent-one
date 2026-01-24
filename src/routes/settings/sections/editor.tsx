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
  inputStyleAtom,
  markdownHighlightingAtom,
  regenerateOnSaveAtom,
  submitKeyAtom,
} from "@/lib/jotai/settings-atoms";
import { resetSetting } from "@/lib/settings/reset-settings";
import {
  DEFAULT_SETTINGS,
  type InputStyleOption,
  type SubmitKeyOption,
} from "@/lib/settings/types";

export default function EditorSection() {
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(
    markdownHighlightingAtom,
  );
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);
  const [inputStyle, setInputStyle] = useAtom(inputStyleAtom);
  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);

  const isMarkdownHighlightingDefault =
    markdownHighlighting === DEFAULT_SETTINGS.MARKDOWN_HIGHLIGHTING;
  const isSubmitKeyDefault = submitKey === DEFAULT_SETTINGS.SUBMIT_KEY;
  const isInputStyleDefault = inputStyle === DEFAULT_SETTINGS.INPUT_STYLE;
  const isRegenerateOnSaveDefault =
    regenerateOnSave === DEFAULT_SETTINGS.REGENERATE_ON_SAVE;

  const handleResetMarkdownHighlighting = () => {
    resetSetting("MARKDOWN_HIGHLIGHTING");
  };

  const handleResetSubmitKey = () => {
    resetSetting("SUBMIT_KEY");
  };

  const handleResetRegenerateOnSave = () => {
    resetSetting("REGENERATE_ON_SAVE");
  };

  const handleResetInputStyle = () => {
    resetSetting("INPUT_STYLE");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Regenerate on Save</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              If enabled, saving an edit to your message will automatically
              regenerate the AI response.
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
              onClick={handleResetRegenerateOnSave}
              disabled={isRegenerateOnSaveDefault}
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
              onClick={handleResetSubmitKey}
              disabled={isSubmitKeyDefault}
              aria-label="Reset to default"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col items-start">
            <Label className="text-sm font-medium">Input Style</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose how the chat input box is displayed. Docked attaches to the
              bottom, floating adds spacing and rounded corners.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={inputStyle}
              onValueChange={(value) =>
                setInputStyle(value as InputStyleOption)
              }
            >
              <SelectTrigger
                className="w-full md:w-fit md:max-w-96"
                aria-label="Select input style"
              >
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docked">Docked</SelectItem>
                <SelectItem value="floating">Floating</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetInputStyle}
              disabled={isInputStyleDefault}
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
