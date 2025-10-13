import ThemeToggle from "@/components/theme/toggle-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppearanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row">
          <div className="flex flex-col items-start">
            <label className="text-sm font-medium">Theme</label>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose your preferred theme for the application.
            </p>
          </div>
          <ThemeToggle className="w-full md:max-w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
