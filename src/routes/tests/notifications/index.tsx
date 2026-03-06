import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsTestRoute() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const checkPermission = async () => {
    addLog("Checking notification permission...");
    try {
      const permissionGranted = await isPermissionGranted();
      addLog(`Permission check result: ${permissionGranted ? "granted" : "not granted"}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Permission check failed: ${errorMessage}`);
    }
  };

  const requestNotificationPermission = async () => {
    addLog("Requesting notification permission...");
    try {
      const permission = await requestPermission();
      addLog(`Permission request result: ${permission}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Permission request failed: ${errorMessage}`);
    }
  };

  const sendTestNotification = async () => {
    addLog("Starting notification flow test...");
    try {
      addLog("Step 1: Checking permission...");
      let permissionGranted = await isPermissionGranted();
      addLog(`Permission status: ${permissionGranted ? "granted" : "not granted"}`);

      if (!permissionGranted) {
        addLog("Step 2: Requesting permission...");
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
        addLog(`Permission request result: ${permission}`);
        addLog(`Permission granted: ${permissionGranted}`);
      }

      if (permissionGranted) {
        addLog("Step 3: Sending notification...");
        sendNotification({
          title: "AgentOne Test",
          body: "Tauri notifications are working!",
        });
        addLog("Notification sent successfully!");
      } else {
        addLog("Permission not granted - cannot send notification");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`Notification test failed: ${errorMessage}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")} className="gap-2">
            <ArrowLeftIcon className="size-4" />
            Back to Tests
          </Button>
          <h1 className="text-2xl font-bold">Notifications Test</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Tests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button onClick={checkPermission} variant="outline">
                  Check Permission
                </Button>
                <Button onClick={requestNotificationPermission} variant="outline">
                  Request Permission
                </Button>
                <Button onClick={sendTestNotification}>Send Test Notification</Button>
              </div>
            </CardContent>
          </Card>

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/20 max-h-96 overflow-y-auto rounded-md border p-4">
                  <pre className="font-mono text-xs whitespace-pre-wrap">{logs.join("\n")}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
