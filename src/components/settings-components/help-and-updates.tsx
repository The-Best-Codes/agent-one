import {
  IconAlertCircle,
  IconBug,
  IconCircleCheck,
  IconDownload,
  IconExternalLink,
  IconMap,
  IconRefresh,
  IconRocket,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import packageJson from "@/../package.json";
import { SettingsLink } from "@/components/a1/settings-link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useUpdate } from "@/contexts/use-update/update-hooks";
import { modelDirectoryStatusAtom, updateModelDirectory } from "@/lib/ai/models/model-directory";
import { AGENT_ONE_BLOG_URL } from "@/lib/constants";
import { tourActiveAtom } from "@/lib/jotai/atoms";
import { RELEASE_POST_URLS } from "@/lib/release-posts";

function formatModelDirectoryTimestamp(value: number, neverLabel: string): string {
  return value ? new Date(value).toLocaleString() : neverLabel;
}

export function AppUpdates() {
  const {
    updateStatus,
    updateProgress,
    updateVersion,
    updateError,
    updateInstalled,
    isWindows,
    checkForUpdates,
    downloadAndInstallUpdate,
    finishUpdate,
  } = useUpdate();

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
          icon: <Spinner data-icon="inline-start" />,
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
          icon: <IconRocket className="text-foreground size-5" />,
          title: `Update available: v${updateVersion}`,
          description: "A new version is ready to download",
        };
      case "downloading":
        return {
          icon: <IconDownload className="text-foreground size-5" />,
          title: `Downloading v${updateVersion}...`,
          description:
            updateProgress === null
              ? "The update is downloading in the background"
              : `${Math.round(updateProgress)}% complete`,
        };
      case "installing":
        return {
          icon: <Spinner data-icon="inline-start" />,
          title: `Installing v${updateVersion}...`,
          description: "Please wait while the update installs",
        };
      case "ready":
        return updateInstalled
          ? {
              icon: <IconRocket className="text-foreground size-5" />,
              title: `v${updateVersion} is ready`,
              description: "It'll be used next time you open AgentOne",
            }
          : {
              icon: <IconRocket className="text-foreground size-5" />,
              title: `v${updateVersion} is ready to install`,
              description: isWindows
                ? "AgentOne will close while the update installs"
                : "AgentOne will restart after the update installs",
            };
      case "error":
        return {
          icon: <IconAlertCircle className="text-destructive size-5" />,
          title: "Update failed",
          description: updateError ?? "Something went wrong while updating",
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

      case "available":
        return (
          <Button
            onClick={() => {
              void downloadAndInstallUpdate();
            }}
            size="sm"
          >
            <IconDownload data-icon="inline-start" />
            Download & Install
          </Button>
        );

      case "ready":
        return (
          <Button
            onClick={() => {
              void finishUpdate();
            }}
            size="sm"
          >
            {updateInstalled ? (
              <IconRefresh data-icon="inline-start" />
            ) : (
              <IconDownload data-icon="inline-start" />
            )}
            {updateInstalled ? "Restart Now" : "Install"}
          </Button>
        );

      case "error":
        return (
          <Button
            onClick={() => {
              void downloadAndInstallUpdate();
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Current Version</p>
          <p className="text-3xl font-bold tracking-tight">{currentVersion}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href={RELEASE_POST_URLS[currentVersion] ?? AGENT_ONE_BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconSparkles data-icon="inline-start" />
            What's New
          </a>
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
              {stateDisplay.icon}
            </div>
            <div className="min-w-0">
              <p className="leading-none font-medium">{stateDisplay.title}</p>
              <p className="text-muted-foreground text-sm wrap-break-word">
                {stateDisplay.description}
              </p>
            </div>
          </div>
          <div className="shrink-0">{getActionButton()}</div>
        </div>

        {(updateStatus === "downloading" || updateStatus === "installing") && (
          <Progress
            value={updateProgress ?? 0}
            indeterminate={
              updateProgress === null || !(updateProgress >= 1 && updateProgress <= 99)
            }
          />
        )}
      </div>
    </div>
  );
}

export function ModelDirectoryUpdates() {
  const modelDirectoryStatus = useAtomValue(modelDirectoryStatusAtom);
  const [isUpdatingModelDirectory, setIsUpdatingModelDirectory] = useState(false);

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

  return (
    <>
      <p className="text-muted-foreground text-sm">
        {"Download the latest"}{" "}
        <SettingsLink className="underline" id="setting-built-in-providers">
          built-in providers'
        </SettingsLink>{" "}
        model metadata. This will update the model list available in the UI.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {modelDirectoryStatus.hasDownloadedList ? "Model list loaded" : "Model list not loaded"}
          </p>
          <p className="text-muted-foreground text-sm tabular-nums">
            {`Last updated: ${formatModelDirectoryTimestamp(
              modelDirectoryStatus.hasDownloadedList ? modelDirectoryStatus.fetchedAt : 0,
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
        </div>
      </div>
    </>
  );
}

export function HelpLinks() {
  const setTourActive = useSetAtom(tourActiveAtom);

  return (
    <div className="flex flex-col gap-1">
      <Link
        to="/chat"
        onClick={() => setTourActive(true)}
        className="flex w-fit items-center gap-1 underline"
      >
        Take the tour
        <IconMap className="size-4" />
      </Link>
      <a
        href="https://github.com/The-Best-Codes/agent-one/issues/new"
        className="flex w-fit items-center gap-1 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Report a bug
        <IconExternalLink className="size-4" />
      </a>
      <a
        href="https://www.agent-one.dev/discord"
        className="flex w-fit items-center gap-1 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Get help on Discord
        <IconExternalLink className="size-4" />
      </a>
      <a
        href="https://docs.agent-one.dev/docs"
        className="flex w-fit items-center gap-1 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read the docs
        <IconExternalLink className="size-4" />
      </a>
    </div>
  );
}

export function DebugTools() {
  const navigate = useNavigate();

  return (
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
  );
}
