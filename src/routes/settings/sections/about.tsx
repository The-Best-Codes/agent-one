import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import packageJson from "@/../package.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const currentVersion = packageJson.version;

  const checkForUpdates = async () => {
    logger.verbose("Initiating update check.");
    try {
      setUpdateStatus("checking");
      setErrorMessage("");
      logger.verbose(
        "Setting update status to 'checking' and clearing previous errors.",
      );

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
      const message =
        error instanceof Error ? error.message : "Failed to check for updates";
      setErrorMessage(message);
      logger.error(`Error during update check: ${message}`, error);
    }
  };

  const downloadAndInstallUpdate = async () => {
    logger.verbose("Initiating download and install of update.");
    try {
      setUpdateStatus("downloading");
      setUpdateProgress(0);
      logger.verbose(
        "Setting update status to 'downloading' and resetting progress.",
      );

      const update = await check();
      if (!update) {
        setUpdateStatus("error");
        setErrorMessage("Update not found");
        logger.error("Update not found during download and install attempt.");
        return;
      }
      logger.verbose(
        `Confirmed update version ${update.version} for download.`,
      );

      await update.downloadAndInstall((event) => {
        logger.verbose(`Update download event: ${event.event}`);
        switch (event.event) {
          case "Started":
            setUpdateProgress(0);
            logger.verbose("Update download started.");
            break;
          case "Progress":
            setUpdateProgress((prev) => {
              const chunkLength = event.data.chunkLength;
              const newProgress = Math.min(
                prev + (chunkLength / 1000) * 100,
                100,
              );
              logger.verbose(`Download progress: ${newProgress.toFixed(2)}%`);
              return newProgress;
            });
            break;
          case "Finished":
            setUpdateProgress(100);
            setUpdateStatus("installing");
            logger.verbose(
              "Update download finished. Setting status to 'installing'.",
            );
            break;
        }
      });

      setUpdateStatus("idle");
      logger.verbose("Update installation complete. Relaunching application.");
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      const message =
        error instanceof Error ? error.message : "Failed to install update";
      setErrorMessage(message);
      logger.error(
        `Error during update download or installation: ${message}`,
        error,
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>About AgentOne</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Version</p>
              <p className="text-2xl font-bold">{currentVersion}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Check for updates</p>
                <p className="text-muted-foreground text-sm">
                  Stay up to date with the latest features and bug fixes
                </p>
              </div>
              {updateStatus === "idle" && (
                <Button onClick={checkForUpdates} variant="outline">
                  Check Now
                </Button>
              )}
              {updateStatus === "checking" && (
                <Button variant="outline" disabled>
                  <Loader2 className="size-4 animate-spin" />
                  Checking...
                </Button>
              )}
              {updateStatus === "error" && (
                <Button onClick={checkForUpdates} variant="outline">
                  Try Again
                </Button>
              )}
            </div>

            {updateStatus === "up-to-date" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">You're up to date!</p>
                  <p className="text-muted-foreground text-sm">
                    AgentOne {currentVersion} is the latest version
                  </p>
                </div>
              </div>
            )}

            {updateStatus === "available" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Update available</p>
                    <p className="text-muted-foreground text-sm">
                      Version {updateVersion} is ready to install
                    </p>
                  </div>
                </div>
                <Button onClick={downloadAndInstallUpdate} className="w-full">
                  Download and Install
                </Button>
              </div>
            )}

            {(updateStatus === "downloading" ||
              updateStatus === "installing") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {updateStatus === "downloading"
                        ? "Downloading update..."
                        : "Installing update..."}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {updateStatus === "downloading"
                        ? `Version ${updateVersion} - ${Math.round(updateProgress)}% complete`
                        : "Please wait while we install the update"}
                    </p>
                  </div>
                </div>
                {updateStatus === "downloading" && (
                  <Progress value={updateProgress} className="w-full" />
                )}
              </div>
            )}

            {updateStatus === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-destructive text-sm font-medium">
                      Update failed
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {errorMessage ||
                        "An error occurred while checking for updates"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
