import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { useAtom, useSetAtom } from "jotai";
import { useNavigate } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { reactScanEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

export default function TestsRoute() {
  const navigate = useNavigate();
  const setOnboardingCompleted = useSetAtom(onboardingCompletedAtom);
  const [reactScanEnabled, setReactScanEnabled] = useAtom(reactScanEnabledAtom);

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/settings")}
            className="gap-2"
          >
            <IconArrowLeft data-icon="inline-start" />
            Back to Settings
          </Button>
          <h1 className="text-2xl font-bold">Tests</h1>
        </div>

        <Alert variant="destructive" className="mb-6">
          <IconAlertTriangle />
          <AlertTitle>Developer Tools</AlertTitle>
          <AlertDescription>
            These tests are intended for developers and debugging only. They may affect your app
            data, performance, or stability. Proceed with caution.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Tests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-muted-foreground text-sm">
                    Test notification permissions and sending notifications
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/notifications")} variant="outline">
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Local Database</h3>
                  <p className="text-muted-foreground text-sm">
                    Stress test and benchmark the local chat database with automatic cleanup
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/local-database")} variant="outline">
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Chat Stress Generator</h3>
                  <p className="text-muted-foreground text-sm">
                    Create large test chats with configurable size and content for UI stress testing
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/chat-stress")} variant="outline">
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Trigger Onboarding</h3>
                  <p className="text-muted-foreground text-sm">
                    Reset onboarding state and restart the onboarding flow
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setOnboardingCompleted(false);
                    void navigate("/");
                  }}
                  variant="outline"
                >
                  Run Test
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">Log History</h3>
                  <p className="text-muted-foreground text-sm">
                    View persisted application logs from the current session
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/logs")} variant="outline">
                  View Logs
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">React Scan</h3>
                  <p className="text-muted-foreground text-sm">
                    Enable react-scan to visualize component renders for the rest of this session
                  </p>
                </div>
                <Switch checked={reactScanEnabled} onCheckedChange={setReactScanEnabled} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
