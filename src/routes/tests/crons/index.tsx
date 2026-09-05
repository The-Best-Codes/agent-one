import { IconAlarm, IconArrowLeft } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearLaunchCron, getLaunchCron, setLaunchCron } from "@/lib/cron";

function formatDisplayTime(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;
  return `${twelveHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export default function CronsTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [time, setTime] = useState("19:00");
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const state = await getLaunchCron();
        if (cancelled) {
          return;
        }

        setEnabled(state.enabled);
        setSavedTime(state.time);
        if (state.time) {
          setTime(state.time);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        toast.error(t("tests.launchCronLoadFailed", { error: message }));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleEnable = async () => {
    if (!time || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const state = await setLaunchCron(time);
      setEnabled(state.enabled);
      setSavedTime(state.time);
      if (state.time) {
        setTime(state.time);
        toast.success(t("tests.launchCronEnabledToast", { time: formatDisplayTime(state.time) }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("tests.launchCronSaveFailed", { error: message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisable = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await clearLaunchCron();
      setEnabled(false);
      setSavedTime(null);
      toast.success(t("tests.launchCronDisabledToast"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t("tests.launchCronDisableFailed", { error: message }));
    } finally {
      setIsSaving(false);
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
          <h1 className="text-2xl font-bold">{t("tests.launchCronTest")}</h1>
        </div>

        <div className="grid gap-6">
          <Alert>
            <IconAlarm />
            <AlertTitle>{t("tests.launchCronAlertTitle")}</AlertTitle>
            <AlertDescription>{t("tests.launchCronAlertDescription")}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>{t("tests.launchCronCardTitle")}</CardTitle>
              <CardDescription>{t("tests.launchCronCardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="launch-cron-time">{t("tests.launchCronTimeLabel")}</Label>
                <Input
                  id="launch-cron-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={isLoading || isSaving}
                  aria-label={t("tests.launchCronTimeLabel")}
                />
              </div>

              <div className="rounded-md border p-4 text-sm">
                {enabled && savedTime
                  ? t("tests.launchCronEnabledState", { time: formatDisplayTime(savedTime) })
                  : t("tests.launchCronDisabledState")}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void handleEnable()}
                  disabled={isLoading || isSaving || !time}
                >
                  {isSaving ? t("tests.savingLaunchCron") : t("tests.enableLaunchCron")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDisable()}
                  disabled={isLoading || isSaving || !enabled}
                >
                  {t("tests.disableLaunchCron")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
