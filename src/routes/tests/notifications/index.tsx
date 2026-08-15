import { IconArrowLeft } from "@tabler/icons-react";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const checkPermission = async () => {
    addLog(t("tests.checkingPermission"));
    try {
      const permissionGranted = await isPermissionGranted();
      addLog(
        t("tests.permissionResult", {
          result: permissionGranted ? t("tests.granted") : t("tests.notGranted"),
        }),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(t("tests.permissionCheckFailed", { error: errorMessage }));
    }
  };

  const requestNotificationPermission = async () => {
    addLog(t("tests.requestingPermission"));
    try {
      const permission = await requestPermission();
      addLog(t("tests.permissionRequestResult", { result: permission }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(t("tests.permissionRequestFailed", { error: errorMessage }));
    }
  };

  const sendTestNotification = async () => {
    addLog(t("tests.startingNotificationTest"));
    try {
      addLog(t("tests.step1Checking"));
      let permissionGranted = await isPermissionGranted();
      addLog(
        t("tests.permissionStatus", {
          result: permissionGranted ? t("tests.granted") : t("tests.notGranted"),
        }),
      );

      if (!permissionGranted) {
        addLog(t("tests.step2Requesting"));
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
        addLog(t("tests.permissionRequestResult", { result: permission }));
        addLog(t("tests.permissionGranted", { granted: String(permissionGranted) }));
      }

      if (permissionGranted) {
        addLog(t("tests.step3Sending"));
        sendNotification({
          title: t("tests.notificationTitle"),
          body: t("tests.notificationBody"),
        });
        addLog(t("tests.notificationSent"));
      } else {
        addLog(t("tests.permissionDenied"));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(t("tests.notificationTestFailed", { error: errorMessage }));
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")} className="gap-2">
            <IconArrowLeft data-icon="inline-start" />
            {t("tests.backToTests")}
          </Button>
          <h1 className="text-2xl font-bold">{t("tests.notificationsTest")}</h1>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("tests.notificationTests")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button onClick={checkPermission} variant="outline">
                  {t("tests.checkPermission")}
                </Button>
                <Button onClick={requestNotificationPermission} variant="outline">
                  {t("tests.requestPermission")}
                </Button>
                <Button onClick={sendTestNotification}>{t("tests.sendTestNotification")}</Button>
              </div>
            </CardContent>
          </Card>

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("tests.logs")}</CardTitle>
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
