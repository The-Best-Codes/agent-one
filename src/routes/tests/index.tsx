import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { onboardingCompletedAtom } from "@/lib/jotai/atoms";
import { reactScanEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

export default function TestsRoute() {
  const { t } = useTranslation();
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
            {t("tests.backToSettings")}
          </Button>
          <h1 className="text-2xl font-bold">{t("tests.title")}</h1>
        </div>

        <Alert variant="destructive" className="mb-6">
          <IconAlertTriangle />
          <AlertTitle>{t("tests.developerTools")}</AlertTitle>
          <AlertDescription>{t("tests.developerToolsDescription")}</AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("tests.availableTests")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.notifications")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.notificationsDescription")}
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/notifications")} variant="outline">
                  {t("tests.runTest")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.launchCron")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.launchCronDescription")}
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/crons")} variant="outline">
                  {t("tests.runTest")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.localDatabase")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.localDatabaseDescription")}
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/local-database")} variant="outline">
                  {t("tests.runTest")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.chatStress")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.chatStressDescription")}
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/chat-stress")} variant="outline">
                  {t("tests.runTest")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.triggerOnboarding")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.triggerOnboardingDescription")}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setOnboardingCompleted(false);
                    void navigate("/");
                  }}
                  variant="outline"
                >
                  {t("tests.runTest")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.logHistory")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("tests.logHistoryDescription")}
                  </p>
                </div>
                <Button onClick={() => navigate("/tests/logs")} variant="outline">
                  {t("tests.viewLogs")}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <h3 className="font-medium">{t("tests.reactScan")}</h3>
                  <p className="text-muted-foreground text-sm">{t("tests.reactScanDescription")}</p>
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
