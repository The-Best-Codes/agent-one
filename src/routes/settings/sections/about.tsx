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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useUpdate } from "@/contexts/use-update/update-hooks";
import {
  modelDirectoryStatusAtom,
  resetModelDirectory,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { debugModeEnabledAtom } from "@/lib/jotai/unsynced-local-atoms";

import SettingsTarget from "../settings-target";

function formatModelDirectoryTimestamp(value: number, neverLabel: string): string {
  return value ? new Date(value).toLocaleString() : neverLabel;
}

export default function AboutSection() {
  const navigate = useNavigate();
  const { updateStatus, updateProgress, updateVersion, checkForUpdates, downloadAndInstallUpdate } =
    useUpdate();
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
          title: "Check for updates",
          description: "Stay up to date with the latest features and bug fixes",
        };
      case "checking":
        return {
          icon: <Spinner className="text-primary" data-icon="inline-start" />,
          title: "Checking for updates...",
          description: "Please wait while we check for the latest version",
        };
      case "managed-externally":
        return {
          icon: <IconShieldCheck className="text-muted-foreground size-5" />,
          title: "Automatic updates disabled",
          description: "Update AgentOne through your software manager instead",
        };
      case "up-to-date":
        return {
          icon: <IconCircleCheck className="size-5" />,
          title: "You're up to date",
          description: "AgentOne is running the latest version",
        };
      case "available":
        return {
          icon: <IconRocket className="text-primary size-5" />,
          title: `Update available: v${updateVersion}`,
          description: "A new version is ready to install",
        };
      case "downloading":
        return {
          icon: <IconDownload className="text-primary size-5" />,
          title: "Downloading update...",
          description: `${Math.round(updateProgress)}% complete`,
        };
      case "installing":
        return {
          icon: <Spinner className="text-primary" data-icon="inline-start" />,
          title: "Installing update...",
          description: "Please wait while we install the update",
        };
      case "error":
        return {
          icon: <IconAlertCircle className="text-destructive size-5" />,
          title: "Update failed",
          description: "Something went wrong while checking for updates",
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
              void checkForUpdates();
            }}
            variant="outline"
            size="sm"
          >
            <IconRefresh data-icon="inline-start" />
            Check Now
          </Button>
        );

      case "checking":
        return (
          <Button variant="outline" size="sm" disabled>
            <Spinner data-icon="inline-start" />
            Checking...
          </Button>
        );

      case "managed-externally":
        return null;
      case "available":
        return (
          <SettingsTarget id="setting-download-and-install-update">
            <Button
              onClick={() => {
                void downloadAndInstallUpdate();
              }}
              size="sm"
            >
              <IconDownload data-icon="inline-start" />
              Download & Install
            </Button>
          </SettingsTarget>
        );

      case "error":
        return (
          <Button
            onClick={() => {
              void checkForUpdates();
            }}
            variant="outline"
            size="sm"
          >
            <IconRefresh data-icon="inline-start" />
            Try Again
          </Button>
        );

      default:
        return null;
    }
  };

  const stateDisplay = getStateDisplay();

  const handleUpdateModelDirectory = async () => {
    setIsUpdatingModelDirectory(true);

    const result = await updateModelDirectory();
    setIsUpdatingModelDirectory(false);

    if (!result.ok) {
      toast.error("Failed to update model list", { description: result.error });
      return;
    }

    toast.success("Model list updated", {
      description: `${result.providerCount ?? 0} providers, ${
        result.modelCount ?? 0
      } models loaded.`,
    });
  };

  const handleResetModelDirectory = async () => {
    await resetModelDirectory();
    toast.success("Model list reset to bundled version");
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsTarget id="setting-app-updates">
        <Card>
          <CardHeader>
            <CardTitle>App Updates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-muted-foreground text-sm">Current Version</p>
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
                <Progress
                  value={updateProgress}
                  indeterminate={!(updateProgress >= 1 && updateProgress <= 99)}
                />
              )}
            </div>

            {selectedReleaseNotes && (
              <Accordion type="single" collapsible className="border-t pt-3">
                <AccordionItem value="release-notes" className="border-b-0">
                  <AccordionTrigger className="py-1.5">Release notes</AccordionTrigger>
                  <AccordionContent className="h-auto overflow-visible pb-0">
                    <Select
                      value={selectedReleaseNotesVersion}
                      onValueChange={setSelectedReleaseNotesVersion}
                    >
                      <SelectTrigger
                        className="mb-3"
                        size="sm"
                        aria-label="Select release notes version"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {releaseNoteVersions.map((version) => (
                            <SelectItem key={version} value={version}>
                              v{version}
                            </SelectItem>
                          ))}
                        </SelectGroup>
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
      </SettingsTarget>
      <SettingsTarget id="setting-model-directory">
        <Card>
          <CardHeader>
            <CardTitle>Model List Updates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {"Download the latest"}{" "}
              <Link className="underline" to="/settings?tab=providers#setting-built-in-providers">
                built-in providers'
              </Link>{" "}
              model metadata. This will update the model list available in the UI.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {modelDirectoryStatus.usingDownloadedList
                    ? "Using downloaded model list"
                    : "Using bundled model list"}
                </p>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {`Last updated: ${formatModelDirectoryTimestamp(
                    modelDirectoryStatus.fetchedAt,
                    "Never",
                  )}`}
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
                  Update now
                </Button>
                <Button
                  onClick={handleResetModelDirectory}
                  disabled={isUpdatingModelDirectory || !modelDirectoryStatus.usingDownloadedList}
                  variant="outline"
                  size="sm"
                >
                  <IconRestore data-icon="inline-start" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsTarget>
      <Card>
        <CardHeader>
          <CardTitle>Help</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <a
              target="_blank"
              href="https://github.com/AgentOne-Dev/agent-one-public/issues/new"
              className="flex w-fit items-center gap-1 underline"
            >
              Report a bug
              <IconExternalLink className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://www.agent-one.dev/discord"
              className="flex w-fit items-center gap-1 underline"
            >
              Get help on Discord
              <IconExternalLink className="size-4" />
            </a>
            <a
              target="_blank"
              href="https://docs.agent-one.dev/docs"
              className="flex w-fit items-center gap-1 underline"
            >
              Read the docs
              <IconExternalLink className="size-4" />
            </a>
          </div>
        </CardContent>
      </Card>
      {debugMode && (
        <SettingsTarget id="setting-debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <IconBug className="text-muted-foreground size-5" />
                  </div>
                  <div>
                    <p className="leading-none font-medium">Internal Tests</p>
                    <p className="text-muted-foreground text-sm">
                      Access internal testing tools and utilities.
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate("/tests")} size="sm">
                  Open Tests
                </Button>
              </div>
            </CardContent>
          </Card>
        </SettingsTarget>
      )}
    </div>
  );
}
