import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import packageJson from "@/../package.json";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const credits = [
  {
    id: "fnm",
    title: "fnm (Fast Node Manager)",
    content: (
      <div>
        <p>
          This application uses fnm for Node.js version management during
          onboarding. fnm is licensed under the GNU General Public License v3.0.
        </p>
        <p className="mt-2">
          For the complete license text, visit{" "}
          <a
            href="https://github.com/Schniz/fnm"
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            the fnm repository
          </a>
          .
        </p>
        <p className="mt-2">
          Source code access: Contact us for the complete corresponding source
          code for the bundled fnm binary.
        </p>
      </div>
    ),
  },
];

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
    try {
      setUpdateStatus("checking");
      setErrorMessage("");

      const update = await check();

      if (update) {
        setUpdateVersion(update.version);
        setUpdateStatus("available");
      } else {
        setUpdateStatus("up-to-date");
      }
    } catch (error) {
      setUpdateStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to check for updates",
      );
    }
  };

  const downloadAndInstallUpdate = async () => {
    try {
      setUpdateStatus("downloading");
      setUpdateProgress(0);

      const update = await check();
      if (!update) {
        setUpdateStatus("error");
        setErrorMessage("Update not found");
        return;
      }

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
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to install update",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>About AgentOne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits and Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {credits.map((credit) => (
              <AccordionItem key={credit.id} value={credit.id}>
                <AccordionTrigger>{credit.title}</AccordionTrigger>
                <AccordionContent>{credit.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
