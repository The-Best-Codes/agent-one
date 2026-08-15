import {
  IconAlertCircle,
  IconBug,
  IconCircleCheck,
  IconDownload,
  IconExternalLink,
  IconRefresh,
  IconRestore,
  IconRocket,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import packageJson from "@/../package.json";
import { getReleaseNotes, getReleaseNotesVersions } from "@/assets/release-notes";
import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useUpdate } from "@/contexts/use-update/update-hooks";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import {
  modelDirectoryStatusAtom,
  resetModelDirectory,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { analyticsIdentityAtom } from "@/lib/jotai/settings-atoms";
import { debugModeEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

import SettingsTarget from "../settings-target";

function formatModelDirectoryTimestamp(value: number, neverLabel: string): string {
  return value ? new Date(value).toLocaleString() : neverLabel;
}

export default function AboutSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateStatus, updateProgress, updateVersion, checkForUpdates, downloadAndInstallUpdate } =
    useUpdate();
  const { user } = useWebAuth();
  const [analyticsIdentity, setAnalyticsIdentity] = useAtom(analyticsIdentityAtom);
  const [debugMode] = useAtom(debugModeEnabledAtom);
  const modelDirectoryStatus = useAtomValue(modelDirectoryStatusAtom);
  const [isUpdatingModelDirectory, setIsUpdatingModelDirectory] = useState(false);

  const currentVersion = packageJson.version;
  const releaseNoteVersions = useMemo(() => getReleaseNotesVersions(), []);
  const [selectedReleaseNotesVersion, setSelectedReleaseNotesVersion] = useState(
    releaseNoteVersions.includes(currentVersion) ? currentVersion : releaseNoteVersions[0],
  );
  const selectedReleaseNotes = selectedReleaseNotesVersion
    ? getReleaseNotes(selectedReleaseNotesVersion)
    : null;

  const getStateDisplay = () => {
    switch (updateStatus) {
      case "idle":
        return {
          icon: <IconShieldCheck className="text-muted-foreground size-5" />,
          title: t("about.checkForUpdates"),
          description: t("about.checkForUpdatesDescription"),
        };
      case "checking":
        return {
          icon: <Spinner className="text-primary" data-icon="inline-start" />,
          title: t("about.checking"),
          description: t("about.checkingDescription"),
        };
      case "managed-externally":
        return {
          icon: <IconShieldCheck className="text-muted-foreground size-5" />,
          title: t("about.managedExternally"),
          description: t("about.managedExternallyDescription"),
        };
      case "up-to-date":
        return {
          icon: <IconCircleCheck className="size-5" />,
          title: t("about.upToDate"),
          description: t("about.upToDateDescription"),
        };
      case "available":
        return {
          icon: <IconRocket className="text-primary size-5" />,
          title: t("about.updateAvailable", { version: updateVersion }),
          description: t("about.updateAvailableDescription"),
        };
      case "downloading":
        return {
          icon: <IconDownload className="text-primary size-5" />,
          title: t("about.downloading"),
          description: t("about.downloadPercent", { percent: Math.round(updateProgress) }),
        };
      case "installing":
        return {
          icon: <Spinner className="text-primary" data-icon="inline-start" />,
          title: t("about.installing"),
          description: t("about.installingDescription"),
        };
      case "error":
        return {
          icon: <IconAlertCircle className="text-destructive size-5" />,
          title: t("about.updateFailed"),
          description: t("about.updateFailedDescription"),
        };
    }
  };

  const getActionButton = () => {
    switch (updateStatus) {
      case "idle":
      case "up-to-date":
        return (
          <Button
            onClick={() => {
              trackSettingsInteraction("about", "check_for_updates");
              void checkForUpdates();
            }}
            variant="outline"
            size="sm"
          >
            <IconRefresh data-icon="inline-start" />
            {t("about.checkNow")}
          </Button>
        );
      case "checking":
        return (
          <Button variant="outline" size="sm" disabled>
            <Spinner data-icon="inline-start" />
            {t("about.checkingButton")}
          </Button>
        );
      case "managed-externally":
        return null;
      case "available":
        return (
          <Button
            onClick={() => {
              trackSettingsInteraction("about", "download_and_install_update");
              void downloadAndInstallUpdate();
            }}
            size="sm"
          >
            <IconDownload data-icon="inline-start" />
            {t("about.downloadAndInstall")}
          </Button>
        );
      case "error":
        return (
          <Button
            onClick={() => {
              trackSettingsInteraction("about", "retry_update_check");
              void checkForUpdates();
            }}
            variant="outline"
            size="sm"
          >
            <IconRefresh data-icon="inline-start" />
            {t("about.tryAgain")}
          </Button>
        );
      default:
        return null;
    }
  };

  const stateDisplay = getStateDisplay();

  const handleUpdateModelDirectory = async () => {
    setIsUpdatingModelDirectory(true);
    trackSettingsInteraction("about", "model_directory_update");
    const result = await updateModelDirectory();
    setIsUpdatingModelDirectory(false);

    if (!result.ok) {
      toast.error(t("about.failedToUpdateModelList"), { description: result.error });
      return;
    }

    toast.success(t("about.modelListUpdated"), {
      description: t("about.modelListUpdatedDescription", {
        providerCount: result.providerCount ?? 0,
        modelCount: result.modelCount ?? 0,
      }),
    });
  };

  const handleResetModelDirectory = async () => {
    trackSettingsInteraction("about", "model_directory_reset");
    await resetModelDirectory();
    toast.success(t("about.modelListReset"));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("about.appUpdates")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <p className="text-muted-foreground text-sm">{t("about.currentVersion")}</p>
            <p className="text-3xl font-bold tracking-tight">{currentVersion}</p>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  {stateDisplay.icon}
                </div>
                <div>
                  <p className="leading-none font-medium">{stateDisplay.title}</p>
                  <p className="text-muted-foreground text-sm">{stateDisplay.description}</p>
                </div>
              </div>
              {getActionButton()}
            </div>

            {(updateStatus === "downloading" || updateStatus === "installing") && (
              <Progress value={updateProgress} />
            )}
          </div>

          {selectedReleaseNotes && (
            <Accordion type="single" collapsible className="border-t pt-3">
              <AccordionItem value="release-notes" className="border-b-0">
                <AccordionTrigger className="py-1.5">{t("about.releaseNotes")}</AccordionTrigger>
                <AccordionContent className="h-auto overflow-visible pb-0">
                  <Select
                    value={selectedReleaseNotesVersion}
                    onValueChange={setSelectedReleaseNotesVersion}
                  >
                    <SelectTrigger
                      className="mb-3"
                      size="sm"
                      aria-label={t("about.selectReleaseNotesVersion")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {releaseNoteVersions.map((version) => (
                        <SelectItem key={version} value={version}>
                          v{version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="prose prose-sm prose-neutral dark:prose-invert prose-quoteless max-w-none">
                    <MemoizedMarkdown
                      allowInternalLinks
                      content={selectedReleaseNotes}
                      id={`release-notes-${selectedReleaseNotesVersion}`}
                      messageRole="assistant"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
      <SettingsTarget id="setting-model-directory">
        <Card>
          <CardHeader>
            <CardTitle>{t("about.modelListUpdates")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {t("about.modelListUpdatesDescriptionBefore")}{" "}
              <Link className="underline" to="/settings?tab=providers#setting-built-in-providers">
                {t("about.builtInProvidersLink")}
              </Link>{" "}
              {t("about.modelListUpdatesDescriptionAfter")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {modelDirectoryStatus.usingDownloadedList
                    ? t("about.usingDownloaded")
                    : t("about.usingBundled")}
                </p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {t("about.lastUpdated", {
                    date: formatModelDirectoryTimestamp(
                      modelDirectoryStatus.fetchedAt,
                      t("about.never"),
                    ),
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleUpdateModelDirectory}
                  disabled={isUpdatingModelDirectory}
                  size="sm"
                >
                  {isUpdatingModelDirectory ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <IconRefresh data-icon="inline-start" />
                  )}
                  {t("about.updateNow")}
                </Button>
                <Button
                  onClick={handleResetModelDirectory}
                  disabled={isUpdatingModelDirectory || !modelDirectoryStatus.usingDownloadedList}
                  variant="outline"
                  size="sm"
                >
                  <IconRestore data-icon="inline-start" />
                  {t("common.reset")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsTarget>
      <Card>
        <CardHeader>
          <CardTitle>{t("about.help")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <a
              target="_blank"
              href="https://github.com/AgentOne-Dev/agent-one-public/issues/new"
              className="flex w-fit items-center gap-1 underline"
            >
              {t("about.reportBug")}
              <IconExternalLink className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://www.agent-one.dev/discord"
              className="flex w-fit items-center gap-1 underline"
            >
              {t("about.getHelpDiscord")}
              <IconExternalLink className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://docs.agent-one.dev/docs"
              className="flex w-fit items-center gap-1 underline"
            >
              {t("about.readDocs")}
              <IconExternalLink className="size-4" />
            </a>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("about.usageAnalytics")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingsTarget id="setting-allow-usage-analytics">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium">{t("about.allowAnalytics")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("about.allowAnalyticsDescription")}
                </p>
              </div>
              <Switch
                checked={analyticsIdentity !== "off"}
                onCheckedChange={(checked) => {
                  const nextValue = checked ? "user-id" : "off";
                  trackSettingsInteraction("about", "analytics_enabled_toggled", {
                    value: nextValue,
                  });
                  setAnalyticsIdentity(nextValue);
                }}
                aria-label={t("about.allowAnalytics")}
              />
            </div>
          </SettingsTarget>
          <SettingsTarget id="setting-associate-analytics-with-my-signed-in-account">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium">{t("about.associateAnalytics")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("about.associateAnalyticsDescription")}
                </p>
                <a
                  href="https://www.agent-one.dev/privacy?utm_source=desktop-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit underline"
                >
                  {t("about.learnMore")}
                </a>
              </div>

              <AdaptiveTooltip>
                <AdaptiveTooltipTrigger asChild>
                  <span>
                    <Switch
                      checked={analyticsIdentity === "user-id"}
                      disabled={analyticsIdentity === "off" || !user}
                      onCheckedChange={(checked) => {
                        trackSettingsInteraction("about", "analytics_identity_toggled", {
                          value: checked ? "user-id" : "anonymous",
                          signed_in: Boolean(user),
                        });
                        setAnalyticsIdentity(checked ? "user-id" : "anonymous");
                      }}
                      aria-label={t("about.associateAnalytics")}
                    />
                  </span>
                </AdaptiveTooltipTrigger>
                {!user && (
                  <AdaptiveTooltipContent>{t("about.notSignedInAnalytics")}</AdaptiveTooltipContent>
                )}
              </AdaptiveTooltip>
            </div>
          </SettingsTarget>
        </CardContent>
      </Card>
      {debugMode && (
        <Card>
          <CardHeader>
            <CardTitle>{t("about.debug")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <IconBug className="text-muted-foreground size-5" />
                </div>
                <div>
                  <p className="leading-none font-medium">{t("about.internalTests")}</p>
                  <p className="text-muted-foreground text-sm">
                    {t("about.internalTestsDescription")}
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/tests")} size="sm">
                {t("about.openTests")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
