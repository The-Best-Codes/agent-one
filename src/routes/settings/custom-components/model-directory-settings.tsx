import { IconRefresh, IconRestore } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  modelDirectoryStatusAtom,
  resetModelDirectory,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { trackSettingsInteraction } from "@/lib/google-analytics";

function formatTimestamp(value: number, neverLabel: string): string {
  return value ? new Date(value).toLocaleString() : neverLabel;
}

export default function ModelDirectorySettings() {
  const modelDirectoryStatus = useAtomValue(modelDirectoryStatusAtom);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    trackSettingsInteraction("model-updates", "model_directory_update");
    const result = await updateModelDirectory();
    setIsUpdating(false);

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

  const handleReset = async () => {
    trackSettingsInteraction("model-updates", "model_directory_reset");
    await resetModelDirectory();
    toast.success("Model list reset to bundled version");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {"Download the latest"}{" "}
        <Link
          className="underline"
          to="/settings?tab=built-in-providers#setting-built-in-providers"
        >
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
            {`Last updated: ${formatTimestamp(modelDirectoryStatus.fetchedAt, "Never")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleUpdate} disabled={isUpdating} size="sm">
            {isUpdating ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <IconRefresh data-icon="inline-start" />
            )}
            Update now
          </Button>
          <Button
            onClick={handleReset}
            disabled={isUpdating || !modelDirectoryStatus.usingDownloadedList}
            variant="outline"
            size="sm"
          >
            <IconRestore data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
