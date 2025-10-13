import { useAtom } from "jotai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { type SubmitKeyOption } from "@/lib/settings/types";

export default function EditorSection() {
  const [markdownHighlighting, setMarkdownHighlighting] = useAtom(
    markdownHighlightingAtom,
  );
  const [submitKey, setSubmitKey] = useAtom(submitKeyAtom);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Markdown Highlighting</label>
            <p className="text-muted-foreground mt-1 text-sm">
              When enabled, text formatting like **bold**, *italic*, and `code`
              will be visually highlighted as you type. When disabled, you'll
              see plain text without any special formatting colors or styles.
            </p>
          </div>
          <Switch
            checked={markdownHighlighting}
            onCheckedChange={setMarkdownHighlighting}
            aria-label="Toggle markdown highlighting"
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Submit Key</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose which key combination submits your message.
            </p>
          </div>
          <Select
            value={submitKey}
            onValueChange={(value) => setSubmitKey(value as SubmitKeyOption)}
          >
            <SelectTrigger size="sm" className="w-full md:w-fit md:max-w-96">
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
}
