import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Download,
  DownloadIcon,
  RefreshCw,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";

import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useUpdate } from "@/contexts/use-update/update-hooks";

export default function AboutSection() {
  const { updateStatus, updateProgress, updateVersion, checkForUpdates, downloadAndInstallUpdate } =
    useUpdate();

  const currentVersion = packageJson.version;

  const getStateDisplay = () => {
    switch (updateStatus) {
      case "idle":
        return {
          icon: <ShieldCheckIcon className="text-muted-foreground size-5" />,
          title: "Check for updates",
          description: "Stay up to date with the latest features and bug fixes",
        };
      case "checking":
        return {
          icon: <Spinner className="text-primary" data-icon="inline-start" />,
          title: "Checking for updates...",
          description: "Please wait while we check for the latest version",
        };
      case "up-to-date":
        return {
          icon: <CheckCircle2Icon className="size-5" />,
          title: "You're up to date",
          description: "AgentOne is running the latest version",
        };
      case "available":
        return {
          icon: <RocketIcon className="text-primary size-5" />,
          title: `Update available: v${updateVersion}`,
          description: "A new version is ready to install",
        };
      case "downloading":
        return {
          icon: <DownloadIcon className="text-primary size-5" />,
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
          icon: <AlertCircleIcon className="text-destructive size-5" />,
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
          <Button onClick={checkForUpdates} variant="outline" size="sm">
            <RefreshCw data-icon="inline-start" />
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
      case "available":
        return (
          <Button onClick={downloadAndInstallUpdate} size="sm">
            <Download data-icon="inline-start" />
            Download &amp; Install
          </Button>
        );
      case "error":
        return (
          <Button onClick={checkForUpdates} variant="outline" size="sm">
            <RefreshCw data-icon="inline-start" />
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
          <CardTitle>Help &amp; Updates</CardTitle>
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
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
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
    </div>
  );
}
