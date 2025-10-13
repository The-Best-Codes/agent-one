import { useAtom } from "jotai";

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
import { type MarkdownRenderingOption } from "@/lib/settings/types";

export default function MessagesSection() {
  const [markdownRendering, setMarkdownRendering] = useAtom(
    markdownRenderingAtom,
  );
  const [maxMessageLength, setMaxMessageLength] = useAtom(maxMessageLengthAtom);
  const [maxCodeblockChars, setMaxCodeblockChars] = useAtom(
    maxCodeblockCharsAtom,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Markdown Rendering</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose which messages should render markdown formatting.
            </p>
          </div>
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
              <SelectItem value="assistant">Assistant messages only</SelectItem>
              <SelectItem value="neither">No messages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Max Message Length</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters before activating performance mode for that
              message.
            </p>
          </div>
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
        </div>

        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">
              Max Codeblock Characters
            </label>
            <p className="text-muted-foreground mt-1 text-sm">
              Maximum characters in code blocks before switching to plain text
              rendering.
            </p>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
