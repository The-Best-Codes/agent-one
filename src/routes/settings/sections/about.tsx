import {
  IconAlertCircle,
  IconCircleCheck,
  IconDownload,
  IconExternalLink,
  IconRefresh,
  IconRocket,
  IconShieldCheck,
} from "@tabler/icons-react";

import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useUpdate } from "@/contexts/use-update/update-hooks";
import { trackSettingsInteraction } from "@/lib/google-analytics";

export default function AboutSection() {
  const { updateStatus, updateProgress, updateVersion, checkForUpdates, downloadAndInstallUpdate } =
    useUpdate();

  const currentVersion = packageJson.version;

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
              trackSettingsInteraction("about", "check_for_updates");
              checkForUpdates();
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
              trackSettingsInteraction("about", "download_and_install_update");
              downloadAndInstallUpdate();
            }}
            size="sm"
          >
            <IconDownload data-icon="inline-start" />
            Download &amp; Install
          </Button>
        );
      case "error":
        return (
          <Button
            onClick={() => {
              trackSettingsInteraction("about", "retry_update_check");
              checkForUpdates();
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <p className="text-muted-foreground text-sm">Current Version</p>
            <p className="text-3xl font-bold tracking-tight">{currentVersion} beta</p>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
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
        </CardContent>
      </Card>
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
    </div>
  );
}
