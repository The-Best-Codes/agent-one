import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/use-settings/settings-hooks";

export default function SettingsRoute() {
  const { settings } = useSettings();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-2xl p-6">
        <div className="relative mb-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-0 left-0"
            asChild
          >
            <Link to="/chat">
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">Back to Chat</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-row items-center justify-between gap-2">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Markdown Highlighting
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    When enabled, text formatting like **bold**, *italic*, and
                    `code` will be visually highlighted as you type. When
                    disabled, you'll see plain text without any special
                    formatting colors or styles.
                  </p>
                </div>
                <Switch
                  checked={settings.MARKDOWN_HIGHLIGHTING.value}
                  onCheckedChange={settings.MARKDOWN_HIGHLIGHTING.set}
                  aria-label="Toggle markdown highlighting"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
                <div className="flex flex-col items-start">
                  <label className="text-sm font-medium">
                    Markdown Rendering
                  </label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose which messages should render markdown formatting.
                  </p>
                </div>
                <Select
                  value={settings.MARKDOWN_RENDERING.value}
                  onValueChange={settings.MARKDOWN_RENDERING.set}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full md:w-fit md:max-w-96"
                  >
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
