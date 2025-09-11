import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { useSettings } from "@/contexts/use-settings/settings-hooks";

export default function SettingsRoute() {
  const { settings } = useSettings();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-2xl p-6">
        <div className="relative mb-2 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-0 left-0"
            asChild
          >
            <Link to="/chat">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Chat
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Markdown Highlighting</label>
                  <p className="text-muted-foreground text-sm">
                    Enable syntax highlighting for Markdown in editors
                  </p>
                </div>
                <Toggle
                  pressed={settings.MARKDOWN_HIGHLIGHTING.value}
                  onPressedChange={settings.MARKDOWN_HIGHLIGHTING.set}
                  aria-label="Toggle markdown highlighting"
                >
                  {settings.MARKDOWN_HIGHLIGHTING.value ? "On" : "Off"}
                </Toggle>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
