import {
  IconAlertCircle,
  IconCircleCheck,
  IconDownload,
  IconRefresh,
  IconRocket,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

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
import { trackSettingsInteraction } from "@/lib/google-analytics";

export default function AppUpdateSettings() {
  const { updateStatus, updateProgress, updateVersion, checkForUpdates, downloadAndInstallUpdate } =
    useUpdate();

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
              trackSettingsInteraction("app-updates", "check_for_updates");
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
          <Button
            onClick={() => {
              trackSettingsInteraction("app-updates", "download_and_install_update");
              void downloadAndInstallUpdate();
            }}
            size="sm"
          >
            <IconDownload data-icon="inline-start" />
            Download & Install
          </Button>
        );

      case "error":
        return (
          <Button
            onClick={() => {
              trackSettingsInteraction("app-updates", "retry_update_check");
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

  return (
    <>
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
          <Progress value={updateProgress} />
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
                <SelectTrigger className="mb-3" size="sm" aria-label="Select release notes version">
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
    </>
  );
}
