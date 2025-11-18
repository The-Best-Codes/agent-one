import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestsRoute() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/chat")}
            className="gap-2"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Chat
          </Button>
          <h1 className="text-2xl font-bold">Tests</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Tests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">FNM Node Installation</h3>
                  <p className="text-muted-foreground text-sm">
                    Test installing Node.js versions using fnm
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/tests/fnm")}
                  variant="outline"
                >
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-muted-foreground text-sm">
                    Test notification permissions and sending notifications
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/tests/notifications")}
                  variant="outline"
                >
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="font-medium">Splash Animation</h3>
                  <p className="text-muted-foreground text-sm">
                    Test the app splash screen animation
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/tests/splash")}
                  variant="outline"
                >
                  Run Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
