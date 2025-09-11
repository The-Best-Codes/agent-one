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
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <p className="text-muted-foreground text-sm">
                    Choose your preferred language
                  </p>
                </div>
                <Select
                  value={settings.APP_LANGUAGE.value}
                  onValueChange={settings.APP_LANGUAGE.set}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Theme</label>
                  <p className="text-muted-foreground text-sm">
                    Choose your preferred theme
                  </p>
                </div>
                <Select
                  value={settings.THEME_MODE.value}
                  onValueChange={settings.THEME_MODE.set}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Save</label>
                  <p className="text-muted-foreground text-sm">
                    Automatically save your work
                  </p>
                </div>
                <Toggle
                  pressed={settings.AUTO_SAVE.value}
                  onPressedChange={settings.AUTO_SAVE.set}
                  aria-label="Toggle auto save"
                >
                  {settings.AUTO_SAVE.value ? "On" : "Off"}
                </Toggle>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
