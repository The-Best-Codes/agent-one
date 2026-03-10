import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Download,
  DownloadIcon,
  RefreshCw,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useState } from "react";

import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type UpdateStatus =
  | "idle"
  | "checking"
  | "up-to-date"
  | "available"
  | "downloading"
  | "installing"
  | "error";

export default function AboutSection() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState<string>("");

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

  const checkForUpdates = async () => {
    logger.verbose("Initiating update check.");
    try {
      setUpdateStatus("checking");

      const update = await check();
      logger.verbose(`Update check completed. Update found: ${!!update}.`);

      if (update) {
        setUpdateVersion(update.version);
        setUpdateStatus("available");
        logger.verbose(
          `Update version ${update.version} available. Setting status to 'available'.`,
        );
      } else {
        setUpdateStatus("up-to-date");
        logger.verbose("No update available. Setting status to 'up-to-date'.");
      }
    } catch (error) {
      setUpdateStatus("error");
      const message = error instanceof Error ? error.message : "Failed to check for updates";
      logger.error(`Error during update check: ${message}`, error);
    }
  };

  const downloadAndInstallUpdate = async () => {
    logger.verbose("Initiating download and install of update.");
    try {
      setUpdateStatus("downloading");
      setUpdateProgress(0);

      const update = await check();
      if (!update) {
        setUpdateStatus("error");
        logger.error("Update not found during download attempt.");
        return;
      }
      logger.verbose(`Confirmed update version ${update.version} for download.`);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setUpdateProgress(0);
            break;
          case "Progress":
            setUpdateProgress((prev) => {
              const chunkLength = event.data.chunkLength;
              return Math.min(prev + (chunkLength / 1000) * 100, 100);
            });
            break;
          case "Finished":
            setUpdateProgress(100);
            setUpdateStatus("installing");
            break;
        }
      });

      setUpdateStatus("idle");
      logger.verbose("Update installation complete. Relaunching application.");
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      const message = error instanceof Error ? error.message : "Failed to install update";
      logger.error(`Error during update: ${message}`, error);
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
            <p className="text-3xl font-bold tracking-tight">{currentVersion}</p>
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
