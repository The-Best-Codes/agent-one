import { IconAlarm, IconArrowLeft, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createCron,
  type Cron,
  deleteCron,
  listCrons,
  setCronEnabled,
  updateCron,
} from "@/lib/cron";

const DEFAULT_SCHEDULE = "0 19 * * *";

export default function CronsTestRoute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [crons, setCrons] = useState<Cron[]>([]);
  const [editingCron, setEditingCron] = useState<Cron | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listCrons()
      .then((loadedCrons) => {
        if (!cancelled) setCrons(loadedCrons);
      })
      .catch((error) => {
        if (!cancelled) toast.error(t("tests.cronLoadFailed", { error: String(error) }));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const openCreateDialog = () => {
    setEditingCron(null);
    setSchedule(DEFAULT_SCHEDULE);
    setMessage("");
    setDialogOpen(true);
  };

  const openEditDialog = (cron: Cron) => {
    setEditingCron(cron);
    setSchedule(cron.schedule);
    setMessage(cron.message ?? "");
    setDialogOpen(true);
  };

  const saveCron = async () => {
    if (!schedule.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const saved = editingCron
        ? await updateCron(editingCron.id, schedule, message || null)
        : await createCron(schedule, message || null);
      setCrons((current) => {
        const index = current.findIndex((cron) => cron.id === saved.id);
        if (index === -1) return [...current, saved];
        return current.map((cron) => (cron.id === saved.id ? saved : cron));
      });
      setDialogOpen(false);
      toast.success(t(editingCron ? "tests.cronUpdated" : "tests.cronCreated"));
    } catch (error) {
      toast.error(t("tests.cronSaveFailed", { error: String(error) }));
    } finally {
      setIsSaving(false);
    }
  };

  const changeEnabled = async (cron: Cron, enabled: boolean) => {
    setBusyId(cron.id);
    try {
      const updated = await setCronEnabled(cron.id, enabled);
      setCrons((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(t(enabled ? "tests.cronEnabled" : "tests.cronDisabled"));
    } catch (error) {
      toast.error(t("tests.cronStateFailed", { error: String(error) }));
    } finally {
      setBusyId(null);
    }
  };

  const removeCron = async (cron: Cron) => {
    setBusyId(cron.id);
    try {
      await deleteCron(cron.id);
      setCrons((current) => current.filter((item) => item.id !== cron.id));
      toast.success(t("tests.cronDeleted"));
    } catch (error) {
      toast.error(t("tests.cronDeleteFailed", { error: String(error) }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/tests")}>
            <IconArrowLeft data-icon="inline-start" />
            {t("tests.backToTests")}
          </Button>
          <h1 className="text-2xl font-bold">{t("tests.cronsTest")}</h1>
        </div>

        <Alert>
          <IconAlarm />
          <AlertTitle>{t("tests.cronsAlertTitle")}</AlertTitle>
          <AlertDescription>{t("tests.cronsAlertDescription")}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{t("tests.cronsCardTitle")}</CardTitle>
              <CardDescription>{t("tests.cronsCardDescription")}</CardDescription>
            </div>
            <Button onClick={openCreateDialog} disabled={isLoading}>
              <IconPlus data-icon="inline-start" />
              {t("tests.addCron")}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!isLoading && crons.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconAlarm />
                  </EmptyMedia>
                  <EmptyTitle>{t("tests.noCrons")}</EmptyTitle>
                  <EmptyDescription>{t("tests.noCronsDescription")}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={openCreateDialog}>
                    <IconPlus data-icon="inline-start" />
                    {t("tests.addCron")}
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              crons.map((cron) => (
                <div
                  key={cron.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-medium">{cron.schedule}</code>
                      <Badge variant={cron.enabled ? "default" : "secondary"}>
                        {t(cron.enabled ? "tests.enabled" : "tests.disabled")}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 truncate text-sm">
                      {cron.message ?? t("tests.noCronMessage")}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate font-mono text-xs">
                      {cron.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cron.enabled}
                      onCheckedChange={(enabled) => void changeEnabled(cron, enabled)}
                      disabled={busyId !== null}
                      aria-label={t(cron.enabled ? "tests.disableCron" : "tests.enableCron")}
                    />
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => openEditDialog(cron)}
                      disabled={busyId !== null}
                      aria-label={t("tests.editCron")}
                    >
                      <IconEdit />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => void removeCron(cron)}
                      disabled={busyId !== null}
                      aria-label={t("tests.deleteCron")}
                    >
                      <IconTrash />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(editingCron ? "tests.editCron" : "tests.addCron")}</DialogTitle>
            <DialogDescription>{t("tests.cronDialogDescription")}</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cron-schedule">{t("tests.cronSchedule")}</FieldLabel>
              <Input
                id="cron-schedule"
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
                placeholder="0 19 * * *"
                disabled={isSaving}
                autoComplete="off"
              />
              <FieldDescription>{t("tests.cronScheduleDescription")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="cron-message">{t("tests.cronMessage")}</FieldLabel>
              <Textarea
                id="cron-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("tests.cronMessagePlaceholder")}
                disabled={isSaving}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void saveCron()} disabled={isSaving || !schedule.trim()}>
              {isSaving ? t("tests.savingCron") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
